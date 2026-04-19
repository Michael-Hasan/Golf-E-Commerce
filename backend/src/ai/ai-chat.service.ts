import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai';
import { AiPromptBuilderService } from './ai-prompt-builder.service';
import { AiCatalogContextService } from './ai-catalog-context.service';
import { AiFallbackService } from './ai-fallback.service';
import type { AiReply } from './types/ai-chat';

type LlmAttemptResult =
  | { type: 'success'; reply: AiReply }
  | { type: 'quota_exceeded' }
  | { type: 'failed' };

type AiHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
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

  constructor(
    private readonly promptBuilder: AiPromptBuilderService,
    private readonly catalogContext: AiCatalogContextService,
    private readonly fallback: AiFallbackService,
  ) {
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
      const fallback = await this.fallback.replyWithRules(message, lang);
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

    return this.fallback.replyWithRules(message, lang);
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
    const catalog = await this.catalogContext.getCatalogItems();
    const saleProducts = await this.catalogContext.getSaleProductsForPrompt();
    const prompt = this.promptBuilder.buildSystemPrompt(
      language,
      catalog,
      saleProducts,
    );

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
        const isServiceUnavailable = fetchErr?.status === 503;
        if (isServiceUnavailable) {
          this.logger.warn(
            `Gemini model ${modelName} throttled with 503; retrying next model`,
          );
          await this.delay(500);
          continue;
        }
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

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

  private defaultSuggestions(language: 'en' | 'ko' | 'uz' = 'en'): string[] {
    return language === 'ko'
      ? ['$500 이하 클럽 추천', '지금 세일 딜 보기', '비거리용 골프공 추천', '반품 정책이 궁금해요?']
      : language === 'uz'
        ? ['$500 gacha eng yaxshi klublar', 'Hozirgi chegirma dillari', 'Masofaga mos to‘plar tavsiyasi', 'Qaytarish siyosati qanday?']
        : ['Best clubs under $500', 'Show me current sale deals', 'Recommend balls for distance', 'What is your return policy?'];
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
