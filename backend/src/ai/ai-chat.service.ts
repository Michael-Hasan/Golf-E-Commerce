import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai';
import { SalesService } from '../sales/sales.service';
import { SaleSort } from '../sales/dto/sale-products.input';
import { ClubSort } from '../sales/dto/club-products.input';
import { BallSort } from '../sales/dto/ball-products.input';
import { BagSort } from '../sales/dto/bag-products.input';
import { ApparelSort } from '../sales/dto/apparel-products.input';
import { AccessorySort } from '../sales/dto/accessory-products.input';

type AiReply = {
  answer: string;
  suggestions: string[];
};

type LlmAttemptResult =
  | { type: 'success'; reply: AiReply }
  | { type: 'quota_exceeded' }
  | { type: 'failed' };

type AiHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
};

type CatalogItem = {
  id: string;
  source: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
};

/** Factual brief for LLM grounding and static fallback (keep in sync with the repo). */
const GREENLINKS_PROJECT_FACTS = `
Project name: GreenLinks — Golf E-Commerce (monorepo).

Purpose: A demo-style online golf shop where customers browse clubs, balls, bags, apparel, accessories, and sale items; view product detail; use cart and wishlist; sign in; open "My Page"; and use an AI shopping assistant plus live Socket.IO chat.

Frontend: Vite + React 18 + React Router + Tailwind. Default dev URL http://localhost:5173. API base is configurable (VITE_API_URL), default http://localhost:3000.

Backend: NestJS 10. GraphQL API at /graphql (Apollo, code-first). REST: POST /ai-chat/respond (shopping assistant), POST /ai-chat/project-info (this overview), POST /admin/uploads/product-image (JWT + admin). WebSocket: Socket.IO namespace /chat for store chat.

Data: PostgreSQL 16 via Docker Compose when used. TypeORM with entity catalog_products (sources: CLUBS, BALLS, BAGS, APPAREL, ACCESSORIES, SALE) and users. If USE_IN_MEMORY_DB is not 0, the app runs without Postgres (in-memory users; catalog-backed queries are empty).

Auth: JWT. Admin role is assigned when the user email is listed in ADMIN_EMAILS at signup.

AI: Shopping assistant uses Google Gemini when GEMINI_API_KEY is set; otherwise rule-based fallbacks. The product-page project-info modal prefers OpenAI ChatGPT when OPENAI_API_KEY is set; otherwise it uses Gemini with the same key if available; otherwise this static fact sheet.

Docs: docs/ER-DIAGRAM.md describes a broader target data model; not every table in that diagram is implemented in the running app.
`.trim();

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
  private readonly geminiModel =
    process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

  constructor(private readonly salesService: SalesService) {
    if (this.geminiApiKey) {
      this.logger.log(`AI mode: Gemini (${this.geminiModel})`);
    } else {
      this.logger.warn('AI mode: fallback rules (GEMINI_API_KEY is not set)');
    }
  }

  private normalizeLang(raw?: string): 'en' | 'ko' | 'uz' {
    const normalized = (raw ?? '').toLowerCase();
    if (normalized === 'ko' || normalized === 'kr') return 'ko';
    if (normalized === 'uz') return 'uz';
    return 'en';
  }

  private getCategoryDisplay(
    source: CatalogItem['source'],
    language: 'en' | 'ko' | 'uz',
  ): string {
    switch (source) {
      case 'CLUBS':
        return language === 'ko' ? '클럽' : language === 'uz' ? 'klublar' : 'clubs';
      case 'BALLS':
        return language === 'ko' ? '골프공' : language === 'uz' ? 'toʻplar' : 'balls';
      case 'BAGS':
        return language === 'ko' ? '골프 백' : language === 'uz' ? 'sumkalar' : 'bags';
      case 'APPAREL':
        return language === 'ko' ? '의류' : language === 'uz' ? 'kiyim' : 'apparel';
      case 'ACCESSORIES':
        return language === 'ko' ? '액세서리' : language === 'uz' ? 'aksessuarlar' : 'accessories';
      case 'SALE':
        return language === 'ko' ? '세일' : language === 'uz' ? 'chegirma' : 'sale';
      default:
        return source.toLowerCase();
    }
  }

  async reply(
    message: string,
    history: AiHistoryItem[] = [],
    language?: string,
  ): Promise<AiReply> {
    const lang = this.normalizeLang(language);
    const llmResult = await this.replyWithLlm(message, history, lang);
    if (llmResult.type === 'success') {
      return llmResult.reply;
    }

    if (llmResult.type === 'quota_exceeded') {
      const fallback = await this.replyWithRules(message, lang);
      return {
        answer:
          lang === 'ko'
            ? `현재 Gemini API 쿼터가 초과되어 로컬 추천 모드로 답변하고 있어요.\n\n${fallback.answer}`
            : lang === 'uz'
              ? `Hozirda Gemini API kvotasi oshib ketganligi sabab, lokal tavsiyalar rejimida javob beraman.\n\n${fallback.answer}`
              : `Gemini API quota is currently exceeded for this project, so I am using local recommendation mode.\n\n${fallback.answer}`,
        suggestions:
          lang === 'ko'
            ? ['쿼터 확인 후 다시 시도', '지금 가장 좋은 딜 보기', '예산별 추천 받기', '두 가지 상품 비교하기']
            : lang === 'uz'
              ? ['Kvota tekshirilgandan keyin qayta urinib ko‘ring', 'Hozir eng yaxshi dillarni ko‘rsat', 'Byudjet bo‘yicha tavsiya', 'Ikki mahsulotni solishtirib ber']
              : [
                  'Retry after checking Gemini API quota',
                  'Show me best deals right now',
                  'Recommend products by budget',
                  'Help me compare two items',
                ],
      };
    }

    return this.replyWithRules(message, lang);
  }

  private async replyWithLlm(
    message: string,
    history: AiHistoryItem[],
    language: 'en' | 'ko' | 'uz',
  ): Promise<LlmAttemptResult> {
    if (!this.geminiApiKey) return { type: 'failed' };

    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    const fallbackChain = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
    ];
    // gemini-2.0-flash often hits a tighter 429 pool than 2.5*; try 2.5* first (runtime-verified on this API).
    const use20FlashLast = this.geminiModel.startsWith('gemini-2.0-flash');
    const modelsToTry = use20FlashLast
      ? Array.from(new Set([...fallbackChain, this.geminiModel]))
      : Array.from(new Set([this.geminiModel, ...fallbackChain]));
    let sawQuotaOrRateLimitFailure = false;
    let sawNonQuotaFailure = false;
    const catalog = await this.getCatalog();

    const summarizedCatalog = catalog
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 35)
      .map(
        (item) =>
          `${item.source} | ${item.category} | ${item.brand} ${item.name} | $${item.price.toFixed(2)} | rating ${item.rating.toFixed(1)}`,
      )
      .join('\n');

    const saleHighlights = (await this.salesService
      .getSaleProducts({ category: 'all', sort: SaleSort.DISCOUNT_DESC }))
      .slice(0, 8)
      .map(
        (item) =>
          `${item.brand} ${item.name}: $${item.salePrice.toFixed(2)} (was $${item.originalPrice.toFixed(2)})`,
      )
      .join('\n');

    const languageInstruction =
      language === 'ko'
        ? 'Write your answer in Korean. Keep suggestions in Korean too.'
        : language === 'uz'
          ? "Javobingizni o‘zbek tilida yozing. Tavsiyalarni ham o‘zbek tilida bering."
          : 'Write your answer in English. Keep suggestions in English too.';

    const prompt = `You are GreenLinks AI, a premium golf e-commerce assistant.
Goals:
1) Give accurate, practical answers grounded in provided catalog data.
2) If user asks for budget, category, or deal recommendations, return concrete product suggestions.
3) If asked about shipping/returns/payment, provide concise policy-style guidance.
4) Never invent products outside given catalog context.
5) Keep answer friendly and concise.
${languageInstruction}

Return STRICT JSON object with this exact shape:
{"answer":"string","suggestions":["string","string","string","string"]}
Suggestions must be short actionable follow-ups.

Catalog (top products):
${summarizedCatalog}

Sale highlights:
${saleHighlights}
`;

    const recentHistory = history.slice(-8);
    let geminiHistory = recentHistory.map((item) => ({
      role: item.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: item.text }],
    }));
    while (geminiHistory.length > 0 && geminiHistory[0].role !== 'user') {
      geminiHistory = geminiHistory.slice(1);
    }

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: prompt,
        });
        const chat = model.startChat({
          history: geminiHistory,
          generationConfig: { temperature: 0.3 },
        });
        const result = await chat.sendMessage(message);
        const raw = result.response.text()?.trim();
        if (!raw) continue;
        return { type: 'success', reply: this.safeParseLlmReply(raw, language) };
      } catch (error) {
        const fetchErr =
          error instanceof GoogleGenerativeAIFetchError ? error : null;
        const status = String(fetchErr?.status ?? 'n/a');
        const messageText =
          error instanceof Error ? error.message : 'unknown Gemini error';
        const isQuotaOrRateLimit =
          fetchErr?.status === 429 ||
          messageText.includes('RESOURCE_EXHAUSTED') ||
          /\b(exceeded your (current )?quota|quota exceeded|rate limit)\b/i.test(
            messageText,
          );
        if (isQuotaOrRateLimit) {
          sawQuotaOrRateLimitFailure = true;
        } else {
          sawNonQuotaFailure = true;
        }
        this.logger.warn(
          `Gemini call failed with model ${modelName} (status: ${status}): ${messageText}`,
        );
      }
    }

    // Only show the quota banner if every failure looked like quota/rate-limit (not e.g. 404 + 429 mix).
    if (sawQuotaOrRateLimitFailure && !sawNonQuotaFailure) {
      return { type: 'quota_exceeded' };
    }

    return { type: 'failed' };
  }

  private safeParseLlmReply(
    raw: string,
    language: 'en' | 'ko' | 'uz',
  ): AiReply {
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const jsonSlice = raw.slice(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(jsonSlice) as Partial<AiReply>;
        if (typeof parsed.answer === 'string' && Array.isArray(parsed.suggestions)) {
          const suggestions = parsed.suggestions
            .filter((item) => typeof item === 'string')
            .slice(0, 4);
          return {
            answer:
              parsed.answer.trim() ||
              (language === 'ko'
                ? '제품 추천을 도와드릴 수 있어요.'
                : language === 'uz'
                  ? 'Men sizga mahsulot tavsiyalarida yordam bera olaman.'
                  : 'I can help with product recommendations.'),
            suggestions:
              suggestions.length ? suggestions : this.defaultSuggestions(language),
          };
        }
      } catch {
        // Continue to fallback parsing.
      }
    }

    return {
      answer: raw,
      suggestions: this.defaultSuggestions(language),
    };
  }

  private async replyWithRules(
    message: string,
    language: 'en' | 'ko' | 'uz',
  ): Promise<AiReply> {
    const normalized = message.trim().toLowerCase();
    if (!normalized) {
      return {
        answer:
          language === 'ko'
            ? '제품, 가격, 세일 딜, 배송, 반품 또는 추천에 대해 물어보세요.'
            : language === 'uz'
              ? 'Mahsulotlar, narxlar, chegirma/dillar, yetkazib berish, qaytarish yoki tavsiyalar haqida so‘rang.'
              : 'Ask me about products, pricing, deals, shipping, returns, or recommendations.',
        suggestions: this.defaultSuggestions(language),
      };
    }

    if (
      this.hasAny(normalized, [
        'hello',
        'hi',
        'hey',
        'good morning',
        'good evening',
        'salom',
        'salam',
        'assalom',
        'xayrli tong',
        'hayrli tong',
        'xayrli oqshom',
        'hayrli oqshom',
      ])
    ) {
      return {
        answer:
          language === 'ko'
            ? '안녕하세요! 저는 GreenLinks AI 어시스턴트입니다. 제품 추천, 예산 옵션, 현재 세일 딜, 배송, 반품을 도와드릴 수 있어요.'
            : language === 'uz'
              ? 'Salom! Men GreenLinks AI yordamchisiman. Men sizga mahsulot tanlovi, byudjet variantlari, hozirgi chegirma dillari, yetkazib berish va qaytarish bo‘yicha yordam beraman.'
              : 'Hello! I am your GreenLinks AI assistant. I can help with product picks, budget options, current sale deals, shipping, and returns.',
        suggestions: this.defaultSuggestions(language),
      };
    }

    if (
      this.hasAny(normalized, [
        'shipping',
        'delivery',
        'arrive',
        'how long',
        'yetkazib',
        'yetkazish',
        'yetib',
        'keladi',
        'jo‘natish',
        "jo'natish",
        'kuryer',
        'courier',
        'yuk tashish',
        'yuk tashish',
        'qachon',
      ])
    ) {
      return {
        answer:
          language === 'ko'
            ? '일반 배송은 보통 영업일 기준 3~5일, 익스프레스는 보통 1~2일 정도 걸려요. $99 이상 주문은 무료 일반 배송이 제공됩니다.'
            : language === 'uz'
              ? 'Standart yetkazib berish odatda 3-5 ish kunida yetib keladi. Ekspress yetkazib berish odatda 1-2 ish kunida. $99 dan yuqori buyurtmalar uchun bepul standart yetkazib berish mavjud.'
              : 'Standard shipping usually arrives in 3-5 business days. Express shipping typically arrives in 1-2 business days. Orders over $99 qualify for free standard shipping.',
        suggestions:
          language === 'ko'
            ? ['반품 정책이 뭐예요?', '지금 진행 중인 딜 보기', '$500 이하 클럽 추천']
            : language === 'uz'
              ? ['Qaytarish siyosati qanday?', 'Hozirgi dillarni ko‘rsat', '$500 gacha eng yaxshi klublar']
              : ['What is your return policy?', 'Show me current deals', 'Best clubs under $500'],
      };
    }

    if (
      this.hasAny(normalized, [
        'return',
        'refund',
        'exchange',
        'qaytar',
        'qaytarish',
        'qaytaramiz',
        'qaytish',
        'pulni qaytar',
        'almashish',
        'almashtirish',
      ])
    ) {
      return {
        answer:
          language === 'ko'
            ? '대부분의 사용하지 않은 상품은 30일 이내에 반품할 수 있어요. 반품 후 원 결제 수단으로 환불이 처리됩니다. 구매 전에 도움이 필요하면 예산과 카테고리에 맞춰 추천해 드릴게요.'
            : language === 'uz'
              ? 'Ko‘pchilik ishlatilmagan mahsulotlarni 30 kun ichida qaytarishingiz mumkin. Qaytarishdan keyin tekshiruvdan so‘ng refund asl to‘lov uslubiga qaytariladi. Sotib olishdan oldin tanlashda yordam kerak bo‘lsa, byudjet va kategoriya bo‘yicha tavsiya qilaman.'
              : 'You can return most unused items within 30 days. Refunds are issued to the original payment method after inspection. If you need help choosing before buying, I can recommend products by budget and category.',
        suggestions:
          language === 'ko'
            ? ['초보자용 세트 추천', '세일 상품 보기', '비거리용 골프공 추천']
            : language === 'uz'
              ? ['Boshlovchi uchun set tavsiya', 'Chegirma mahsulotlarini ko‘rsat', 'Masofaga mos golf to‘plari']
              : ['Recommend a beginner set', 'Show sale products', 'Best golf balls for distance'],
      };
    }

    if (
      this.hasAny(normalized, [
        'payment',
        'card',
        'visa',
        'mastercard',
        'paypal',
        'to‘lov',
        'tо‘lov',
        'tolov',
        'to‘lov',
        'tоlov',
        'karta',
        'kart',
        'bank karta',
        'bank kartasi',
        'kredit',
        'debet',
        'amex',
      ])
    ) {
      return {
        answer:
          language === 'ko'
            ? 'Visa, Mastercard, AmEx 같은 주요 카드와 안전한 결제를 지원합니다. My Page에 결제 수단을 저장하면 다음 구매가 더 빨라져요.'
            : language === 'uz'
              ? 'Biz asosiy kartalarni (Visa, Mastercard, AmEx) va xavfsiz to‘lovni qo‘llab-quvvatlaymiz. Kelajakdagi xaridlar tezroq bo‘lishi uchun My Page’da to‘lov usullarini saqlab qo‘ying.'
              : 'We support major cards (Visa, Mastercard, AmEx) and secure checkout. You can save payment methods in My Page for faster future purchases.',
        suggestions:
          language === 'ko'
            ? ['결제가 안전한가요?', '배송은 얼마나 걸리나요?', '지금 핫딜 보기']
            : language === 'uz'
              ? ['To‘lov xavfsizmi?', 'Yuk tashish qanchalik tez?', 'Hozirgi hot dillarni ko‘rsat']
              : ['Is checkout secure?', 'How fast is shipping?', 'Show me hot deals'],
      };
    }

    const catalog = await this.getCatalog();
    const budget = this.extractBudget(normalized);
    const categoryIntent = this.matchCategory(normalized);

    if (
      this.hasAny(normalized, [
        'sale',
        'deal',
        'discount',
        'hot',
        'chegirma',
        'chegirmalar',
        'dillar',
        'dil',
        'promo',
        'aksiyalar',
        'taklif',
      ])
    ) {
      const deals = (await this.salesService
        .getSaleProducts({ category: 'all', sort: SaleSort.DISCOUNT_DESC }))
        .slice(0, 3);
      if (!deals.length) {
        return {
          answer:
            language === 'ko'
              ? '현재 활성화된 딜은 없지만, 예산에 맞춘 가성비 좋은 추천은 계속해 드릴 수 있어요.'
              : language === 'uz'
                ? 'Hozircha faol chegirmalar yo‘q, lekin baribir byudjetingizga mos kuchli qiymatli tavsiyalarni beraman.'
                : 'There are no active deals at the moment, but I can still suggest strong value picks by budget.',
          suggestions:
            language === 'ko'
              ? ['$500 이하 클럽 추천', '$50 이하 골프공 추천', '액세서리 추천']
              : language === 'uz'
                ? ['$500 gacha eng yaxshi klublar', '$50 gacha eng yaxshi to‘plar', 'Aksessuarlar tavsiyasi']
                : ['Best clubs under $500', 'Best balls under $50', 'Recommend accessories'],
        };
      }

      const lines = deals.map((item) => {
        const discount = Math.round(((item.originalPrice - item.salePrice) / item.originalPrice) * 100);
        return `- ${item.brand} ${item.name}: $${item.salePrice.toFixed(2)} (${discount}% off)`;
      });
      return {
        answer:
          language === 'ko'
            ? `현재 가장 좋은 딜:\n${lines.join('\n')}`
            : language === 'uz'
              ? `Eng yaxshi dillar hozir:\n${lines.join('\n')}`
              : `Top deals right now:\n${lines.join('\n')}`,
        suggestions:
          language === 'ko'
            ? ['클럽 딜 보기', '액세서리 딜 보기', '가성비 최고의 상품 추천']
            : language === 'uz'
              ? ['Klublar bo‘yicha dillarni ko‘rsat', 'Aksessuarlar bo‘yicha dillarni ko‘rsat', 'Eng yaxshi qiymatli mahsulot tavsiyasi']
              : ['Show me club deals', 'Show me accessory deals', 'Recommend best value products'],
      };
    }

    if (budget !== null && categoryIntent) {
      const filtered = catalog
        .filter((item) => item.source === categoryIntent && item.price <= budget)
        .sort((a, b) => b.rating - a.rating || a.price - b.price)
        .slice(0, 4);
      if (!filtered.length) {
        return {
          answer:
            language === 'ko'
              ? `$${budget} 이하의 ${this.getCategoryDisplay(categoryIntent, language)} 제품을 찾지 못했어요. 예산을 조금 늘리면 더 좋은 매치를 찾아드릴게요.`
              : language === 'uz'
                ? `$${budget} gacha ${this.getCategoryDisplay(categoryIntent, language)} mahsulotlarini topa olmadim. Byudjetni oshiring, men eng yaxshi variantlarni topaman.`
                : `I could not find ${categoryIntent.toLowerCase()} products under $${budget}. Try increasing budget, and I will find the best matches.`,
          suggestions:
            language === 'ko'
              ? ['$700 이하로 다시 찾아보기', '지금 세일 딜 보기', '가성비 픽 추천']
              : language === 'uz'
                ? ['$700 gacha urinib ko‘ring', 'Hozirgi chegirma dillarini ko‘rsat', 'Eng yaxshi qiymatli tavsiya']
                : ['Try under $700', 'Show current sale deals', 'Recommend best value picks'],
        };
      }
      return {
        answer:
          language === 'ko'
            ? `$${budget} 이하 최고의 ${this.getCategoryDisplay(categoryIntent, language)} 옵션:\n${filtered
                .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (⭐ ${item.rating.toFixed(1)})`)
                .join('\n')}`
            : language === 'uz'
              ? `$${budget} gacha eng yaxshi ${this.getCategoryDisplay(categoryIntent, language)} variantlari:\n${filtered
                  .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (⭐ ${item.rating.toFixed(1)})`)
                  .join('\n')}`
              : `Best ${categoryIntent.toLowerCase()} options under $${budget}:\n${filtered
          .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (⭐ ${item.rating.toFixed(1)})`)
          .join('\n')}`,
        suggestions:
          language === 'ko'
            ? ['더 많은 옵션 보기', '이 카테고리의 세일 딜이 있나요?', '상위 2개 비교']
            : language === 'uz'
              ? ['Ko‘proq variantlar ko‘rsat', 'Bu kategoriyada chegirma bormi?', 'Eng yaxshi ikki variantni solishtiring']
              : ['Show me more options', 'Any sale deals in this category?', 'Compare top two picks'],
      };
    }

    if (categoryIntent) {
      const categoryItems = catalog
        .filter((item) => item.source === categoryIntent)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
      if (categoryItems.length) {
        return {
          answer:
            language === 'ko'
              ? `최고의 ${this.getCategoryDisplay(categoryIntent, language)} 추천:\n${categoryItems
                  .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (⭐ ${item.rating.toFixed(1)})`)
                  .join('\n')}`
              : language === 'uz'
                ? `Eng yaxshi ${this.getCategoryDisplay(categoryIntent, language)} tavsiyalar:\n${categoryItems
                    .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (⭐ ${item.rating.toFixed(1)})`)
                    .join('\n')}`
                : `Top ${categoryIntent.toLowerCase()} picks:\n${categoryItems
                    .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (⭐ ${item.rating.toFixed(1)})`)
                    .join('\n')}`,
          suggestions:
            language === 'ko'
              ? ['예산 옵션이 있나요?', '세일 상품 보기', '실력에 맞게 추천']
              : language === 'uz'
                ? ['Byudjet variantlari bormi?', 'Chegirma mahsulotlarini ko‘rsat', 'Ma horat darajasiga ko‘ra tavsiya']
                : ['Any budget options?', 'Show sale items', 'Recommend by skill level'],
        };
      }
    }

    if (budget !== null) {
      const withinBudget = catalog
        .filter((item) => item.price <= budget)
        .sort((a, b) => b.rating - a.rating || a.price - b.price)
        .slice(0, 4);
      if (!withinBudget.length) {
        return {
          answer:
            language === 'ko'
              ? `$${budget} 이하의 제품을 찾지 못했어요. 예산을 조금 올려주시면 최선의 옵션을 추천해 드릴게요.`
              : language === 'uz'
                ? `$${budget} gacha mahsulot topilmadi. Byudjetni biroz oshiring, men eng yaxshi variantlarni taklif qilaman.`
                : `I could not find products under $${budget}. Try a higher budget and I will suggest the best options.`,
          suggestions:
            language === 'ko'
              ? ['$100 이하 제품', '$250 이하 제품', '$500 이하 제품']
              : language === 'uz'
                ? ['$100 gacha mahsulotlar', '$250 gacha mahsulotlar', '$500 gacha mahsulotlar']
                : ['Products under $100', 'Products under $250', 'Products under $500'],
        };
      }
      return {
        answer:
          language === 'ko'
            ? `$${budget} 이하 최고의 옵션:\n${withinBudget
                .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (${this.getCategoryDisplay(item.source, language)})`)
                .join('\n')}`
            : language === 'uz'
              ? `$${budget} gacha eng yaxshi variantlar:\n${withinBudget
                  .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (${this.getCategoryDisplay(item.source, language)})`)
                  .join('\n')}`
              : `Best options under $${budget}:\n${withinBudget
                  .map((item) => `- ${item.brand} ${item.name} — $${item.price.toFixed(2)} (${item.source})`)
                  .join('\n')}`,
        suggestions:
          language === 'ko'
            ? ['이 예산의 클럽만 보기', '이 예산의 액세서리만 보기', '평점 높은 제품 위주로 보기']
            : language === 'uz'
              ? ['Faqat klublar (shu byudjet ichida)', 'Faqat aksessuarlar (shu byudjet ichida)', 'Eng yuqori reytingli variantlarni ko‘rsat']
              : ['Only clubs under this budget', 'Only accessories under this budget', 'Show highest rated picks'],
      };
    }

    const namedMatch = this.findByName(normalized, catalog);
    if (namedMatch) {
      const savings =
        typeof namedMatch.originalPrice === 'number' && namedMatch.originalPrice > namedMatch.price
          ? language === 'ko'
            ? ` 현재 $${namedMatch.originalPrice.toFixed(2)}에서 $${namedMatch.price.toFixed(2)}까지 세일 중이에요.`
            : language === 'uz'
              ? ` Hozir $${namedMatch.originalPrice.toFixed(2)}dan $${namedMatch.price.toFixed(2)} gacha chegirmada.`
              : ` It is currently on sale from $${namedMatch.originalPrice.toFixed(2)} to $${namedMatch.price.toFixed(2)}.`
          : language === 'ko'
            ? ` 현재 가격은 $${namedMatch.price.toFixed(2)}입니다.`
            : language === 'uz'
              ? ` Hozirgi narx: $${namedMatch.price.toFixed(2)}.`
              : ` Current price is $${namedMatch.price.toFixed(2)}.`;
      return {
        answer:
          language === 'ko'
            ? `${namedMatch.brand} ${namedMatch.name}은(는) ${this.getCategoryDisplay(namedMatch.source, language)} (${namedMatch.category})에 해당해요. 별점 ${namedMatch.rating.toFixed(1)}점입니다.${savings}`
            : language === 'uz'
              ? `${namedMatch.brand} ${namedMatch.name} ${this.getCategoryDisplay(namedMatch.source, language)} (${namedMatch.category}) ichida. Reyting: ${namedMatch.rating.toFixed(1)} yulduz.${savings}`
              : `${namedMatch.brand} ${namedMatch.name} is in ${namedMatch.source.toLowerCase()} (${namedMatch.category}). Rated ${namedMatch.rating.toFixed(1)} stars.${savings}`,
        suggestions:
          language === 'ko'
            ? ['비슷한 제품 보기', '더 저렴한 대안 있나요?', '장바구니 팁']
            : language === 'uz'
              ? ['O‘xshash mahsulotlarni ko‘rsat', 'Arzonroq variant bormi?', 'Savatga qo‘shish bo‘yicha maslahat']
              : ['Show similar products', 'Any cheaper alternatives?', 'Add-to-cart tips'],
      };
    }

    return {
      answer:
        language === 'ko'
          ? '제품 추천, 가격, 세일 딜, 배송, 반품, 카테고리 가이드까지 도와드릴 수 있어요. 예산과 카테고리를 알려주시면 구체적인 상품을 추천해 드릴게요.'
          : language === 'uz'
            ? 'Men mahsulot tavsiyalari, narx, chegirma/dillar, yetkazib berish, qaytarish va kategoriya bo‘yicha yordam bera olaman. Byudjet va kategoriyangizni ayting, men aniq mahsulotlarni tavsiya qilaman.'
            : 'I can help with product recommendations, pricing, sale deals, shipping, returns, and category guidance. Tell me your budget and category, and I will suggest specific items.',
      suggestions: this.defaultSuggestions(language),
    };
  }

  private defaultSuggestions(language: 'en' | 'ko' | 'uz' = 'en'): string[] {
    return language === 'ko'
      ? ['$500 이하 클럽 추천', '지금 세일 딜 보기', '비거리용 골프공 추천', '반품 정책이 궁금해요?']
      : language === 'uz'
        ? ['$500 gacha eng yaxshi klublar', 'Hozirgi chegirma dillari', 'Masofaga mos to‘plar tavsiyasi', 'Qaytarish siyosati qanday?']
        : ['Best clubs under $500', 'Show me current sale deals', 'Recommend balls for distance', 'What is your return policy?'];
  }

  private hasAny(text: string, words: string[]): boolean {
    return words.some((word) => text.includes(word));
  }

  private matchCategory(text: string): CatalogItem['source'] | null {
    if (
      this.hasAny(text, [
        'club',
        'klub',
        'drayver',
        'drayverlar',
        'ayron',
        'ayronlar',
        'iron',
        'putter',
        'putterlar',
        'wedge',
        'wedj',
        'vij',
      ])
    )
      return 'CLUBS';
    if (this.hasAny(text, ['ball', 'balls', 'to‘p', 'toʻp', 'top', 'toʻplar', 'to‘plar', 'golf'])) return 'BALLS';
    if (this.hasAny(text, ['bag', 'bags', 'sumka', 'sumkalar', 'xalta'])) return 'BAGS';
    if (
      this.hasAny(text, [
        'apparel',
        'kiyim',
        'ko‘ylak',
        'polo',
        'short',
        'shorts',
        'glove',
        'hat',
      ])
    )
      return 'APPAREL';
    if (
      this.hasAny(text, [
        'accessory',
        'aksessuar',
        'aksessuarlar',
        'rangefinder',
        'gps',
        'grip',
        'tee',
      ])
    )
      return 'ACCESSORIES';
    if (
      this.hasAny(text, [
        'sale',
        'discount',
        'deal',
        'chegirma',
        'chegirmalar',
        'dillar',
        'dil',
      ])
    )
      return 'SALE';
    return null;
  }

  private extractBudget(text: string): number | null {
    const normalizeNumber = (raw: string): number | null => {
      const value = Number(raw.replace(/,/g, ''));
      return Number.isFinite(value) ? value : null;
    };

    const currencyMatches = Array.from(text.matchAll(/\$\s*([0-9][0-9,]{1,6})/g));
    if (currencyMatches.length) {
      const last = currencyMatches[currencyMatches.length - 1]?.[1];
      if (last) {
        const value = normalizeNumber(last);
        if (value !== null) return value;
      }
    }

    const budgetPhraseMatch = text.match(
      /(?:under|below|budget|around|up to|upto|within)\s+\$?\s*([0-9][0-9,]{1,6})/,
    );
    if (budgetPhraseMatch?.[1]) {
      const value = normalizeNumber(budgetPhraseMatch[1]);
      if (value !== null) return value;
    }

    const generic = text.match(/([0-9][0-9,]{1,6})/);
    if (!generic?.[1]) return null;

    const value = normalizeNumber(generic[1]);
    if (value === null) return null;

    // Avoid misreading golf handicap numbers as budgets (e.g., "22 handicap").
    if (value <= 54 && text.includes('handicap')) {
      return null;
    }

    return value;
  }

  private findByName(text: string, items: CatalogItem[]): CatalogItem | null {
    let best: CatalogItem | null = null;
    let bestScore = 0;

    for (const item of items) {
      const hay = `${item.brand} ${item.name} ${item.category}`.toLowerCase();
      let score = 0;
      const words = text.split(/\s+/).filter((w) => w.length > 2);
      for (const word of words) {
        if (hay.includes(word)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    return bestScore >= 2 ? best : null;
  }

  private async getCatalog(): Promise<CatalogItem[]> {
    const clubs = (await this.salesService
      .getClubProducts({ page: 1, limit: 100, sort: ClubSort.RATING_DESC }))
      .items.map((item) => ({
        id: item.id,
        source: 'CLUBS',
        category: item.category,
        brand: item.brand,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        rating: item.rating,
      }));
    const balls = (await this.salesService
      .getBallProducts({ page: 1, limit: 100, sort: BallSort.RATING_DESC }))
      .items.map((item) => ({
        id: item.id,
        source: 'BALLS',
        category: item.category,
        brand: item.brand,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        rating: item.rating,
      }));
    const bags = (await this.salesService
      .getBagProducts({ page: 1, limit: 100, sort: BagSort.RATING_DESC }))
      .items.map((item) => ({
        id: item.id,
        source: 'BAGS',
        category: item.category,
        brand: item.brand,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        rating: item.rating,
      }));
    const apparel = (await this.salesService
      .getApparelProducts({ page: 1, limit: 100, sort: ApparelSort.RATING_DESC }))
      .items.map((item) => ({
        id: item.id,
        source: 'APPAREL',
        category: item.category,
        brand: item.brand,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        rating: item.rating,
      }));
    const accessories = (await this.salesService
      .getAccessoryProducts({ page: 1, limit: 100, sort: AccessorySort.RATING_DESC }))
      .items.map((item) => ({
        id: item.id,
        source: 'ACCESSORIES',
        category: item.category,
        brand: item.brand,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        rating: item.rating,
      }));
    const sale = (await this.salesService
      .getSaleProducts({ category: 'all', sort: SaleSort.RATING_DESC }))
      .map((item) => ({
        id: item.id,
        source: 'SALE',
        category: item.category,
        brand: item.brand,
        name: item.name,
        price: item.salePrice,
        originalPrice: item.originalPrice,
        rating: item.rating,
      }));

    return [...clubs, ...balls, ...bags, ...apparel, ...accessories, ...sale];
  }

  /**
   * Product-page modal: OpenAI ChatGPT when OPENAI_API_KEY is set, else Gemini, else static facts.
   */
  async projectOverview(): Promise<{
    answer: string;
    provider: 'openai' | 'gemini' | 'static';
    model?: string;
    note?:
      | 'missing_openai_used_gemini'
      | 'openai_failed_used_gemini'
      | 'no_ai_available';
  }> {
    const openAiKey = process.env.OPENAI_API_KEY?.trim();

    if (openAiKey) {
      const openAi = await this.projectOverviewWithOpenAI();
      if (openAi) {
        return {
          answer: openAi.text,
          provider: 'openai',
          model: openAi.model,
        };
      }
      const geminiFallback = await this.projectOverviewWithGemini();
      if (geminiFallback) {
        return {
          answer: geminiFallback,
          provider: 'gemini',
          note: 'openai_failed_used_gemini',
        };
      }
      return {
        ...this.projectOverviewStaticBody(),
        provider: 'static',
        note: 'no_ai_available',
      };
    }

    const gemini = await this.projectOverviewWithGemini();
    if (gemini) {
      return {
        answer: gemini,
        provider: 'gemini',
        note: 'missing_openai_used_gemini',
      };
    }

    return {
      ...this.projectOverviewStaticBody(),
      provider: 'static',
      note: 'no_ai_available',
    };
  }

  private projectOverviewStaticBody(): { answer: string } {
    const intro = [
      'No AI summary could be generated (add OPENAI_API_KEY for ChatGPT and/or GEMINI_API_KEY for Google Gemini, then restart the server).',
      '',
      'Reference text models are grounded on:',
    ].join('\n');

    return {
      answer: [intro, '', GREENLINKS_PROJECT_FACTS].join('\n'),
    };
  }

  private parseGeminiRetrySeconds(message: string): number | null {
    const m = message.match(/retry in\s+([0-9.]+)\s*s/i);
    if (!m) return null;
    const s = Number(m[1]);
    return Number.isFinite(s) ? Math.min(Math.max(s, 1), 90) : null;
  }

  private async projectOverviewWithGemini(): Promise<string | null> {
    if (!this.geminiApiKey) {
      return null;
    }
    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    const fallbackChain = [
      this.geminiModel,
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ];
    const modelsToTry = Array.from(
      new Set(fallbackChain.map((m) => m.trim()).filter(Boolean)),
    );

    const systemInstruction = [
      'You are Google Gemini helping explain a software project to a visitor on a product page.',
      'Use ONLY the FACTS below. Do not invent policies, shipping claims, or features.',
      'Write a factual overview: what the app is, main shopper features, then stack (Vite/React, NestJS, GraphQL path, REST routes, Socket.IO /chat), then database modes (Postgres vs USE_IN_MEMORY_DB).',
      'Avoid marketing fluff ("your go-to shop", "thrilled to welcome you"). Prefer short bullets where helpful.',
      'No markdown # headings. About 180–280 words unless facts are shorter.',
      '',
      'FACTS:',
      GREENLINKS_PROJECT_FACTS,
    ].join('\n');

    const userMsg =
      'Summarize this GreenLinks project for someone reading a product page.';

    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction,
          });
          const result = await model.generateContent(userMsg);
          let text: string | undefined;
          try {
            text = result.response.text()?.trim();
          } catch {
            this.logger.warn(
              `Gemini project overview: no text for ${modelName} (blocked or empty)`,
            );
            break;
          }
          if (text) {
            return text;
          }
        } catch (error) {
          const messageText =
            error instanceof Error ? error.message : 'unknown Gemini error';
          const fetchErr =
            error instanceof GoogleGenerativeAIFetchError ? error : null;
          const is429 =
            fetchErr?.status === 429 ||
            /\b429\b|Too Many Requests/i.test(messageText);
          if (is429 && attempt === 0) {
            const waitSec = this.parseGeminiRetrySeconds(messageText) ?? 6;
            this.logger.warn(
              `Gemini project overview 429 on ${modelName}; retrying after ${waitSec}s`,
            );
            await new Promise((r) => setTimeout(r, waitSec * 1000));
            continue;
          }
          this.logger.warn(
            `Gemini project overview failed (${modelName}): ${messageText}`,
          );
          break;
        }
      }
    }
    return null;
  }

  private async projectOverviewWithOpenAI(): Promise<{
    text: string;
    model: string;
  } | null> {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      return null;
    }
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
    const system = [
      'You are ChatGPT from OpenAI. You must follow these rules:',
      '',
      '1) Use ONLY the FACTS block below. Do not invent shipping times, return windows, payment partners, or features not listed.',
      '2) Output a factual overview of this software project for someone on a product page. Prefer concrete detail over marketing fluff.',
      '3) Structure: (a) one sentence on what the app is, (b) bullet or short list of main user-facing areas (routes/features), (c) bullet or short list of technical stack and important URLs/paths (e.g. /graphql, /ai-chat/..., Socket.IO /chat), (d) one sentence on database mode (Postgres vs USE_IN_MEMORY_DB).',
      '4) Avoid phrases like "your go-to shop", "we are thrilled", or generic welcome copy.',
      '5) No markdown # headings. Plain text, optional simple bullets with "- ".',
      '6) Target length about 180–320 words unless the facts are shorter.',
      '',
      'FACTS:',
      GREENLINKS_PROJECT_FACTS,
    ].join('\n');
    const userMsg =
      'Summarize the GreenLinks monorepo exactly as implemented. Mention stack, main API surfaces, and env toggles a developer would notice.';

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMsg },
          ],
          temperature: 0.25,
          max_tokens: 1000,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.warn(
          `OpenAI project overview HTTP ${res.status}: ${errText.slice(0, 200)}`,
        );
        return null;
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        return null;
      }
      return { text, model };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      this.logger.warn(`OpenAI project overview failed: ${msg}`);
      return null;
    }
  }
}
