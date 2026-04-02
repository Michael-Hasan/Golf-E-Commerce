import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ORDER_READER, OrderReader } from '../shared/contracts/order-reader.contract';
import { CreateSupportRequestInput } from './dto/create-support-request.input';
import { SupportFaqsQueryInput } from './dto/support-faqs-query.input';
import { SupportOrderLookupInput } from './dto/support-order-lookup.input';
import { PaginatedSupportFaqs } from './models/paginated-support-faqs.model';
import { SupportFaq } from './models/support-faq.model';
import { SupportOrderStatus } from './models/support-order-status.model';
import { SupportTicketResponse } from './models/support-ticket-response.model';
import { SupportTicket } from './support-ticket.entity';

const FAQS_BY_LOCALE: Record<string, SupportFaq[]> = {
  en: [
    {
      id: 'fit-clubs',
      category: 'Buying Advice',
      question: 'How do I choose the right clubs for my game?',
      answer:
        'Start with your current handicap, swing speed, and usual miss. Most newer players benefit from more forgiving heads, mid-launch shafts, and a simple set makeup. If you are between two options, pick the one that helps launch and consistency first.',
      audience: 'All golfers',
      featured: true,
    },
    {
      id: 'shipping-times',
      category: 'Shipping',
      question: 'How fast does shipping usually take?',
      answer:
        'Standard shipping typically arrives in 3 to 5 business days, while express shipping usually arrives in 1 to 2 business days. Orders over $99 qualify for free standard shipping.',
      audience: 'Orders',
      featured: true,
    },
    {
      id: 'returns-window',
      category: 'Returns',
      question: 'What is your return window?',
      answer:
        'Most unused items can be returned within 30 days. Please keep original packaging when possible, and make sure the item has not been personalized or used on course unless the product page says otherwise.',
      audience: 'Orders',
      featured: true,
    },
    {
      id: 'shoe-sizing',
      category: 'Size Guide',
      question: 'Do golf shoes fit the same as running shoes?',
      answer:
        'Usually they fit slightly more structured through the midfoot. If you wear thicker golf socks or play in colder weather, consider checking the width guidance and insole room before choosing your usual size.',
      audience: 'Apparel',
      featured: false,
    },
    {
      id: 'order-tracking',
      category: 'Track Order',
      question: 'What do I need to track an order?',
      answer:
        'Use your GreenLinks order number and the email address used at checkout. If the order is very recent, allow a little time for payment confirmation and warehouse processing before tracking updates appear.',
      audience: 'Orders',
      featured: false,
    },
    {
      id: 'contact-support',
      category: 'Contact',
      question: 'When should I contact support instead of the AI assistant?',
      answer:
        'Use support for order changes, damaged deliveries, account issues, returns, and anything that needs a human follow-up. The AI assistant is best for quick product and policy guidance.',
      audience: 'Support',
      featured: false,
    },
  ],
  ko: [
    {
      id: 'fit-clubs',
      category: '구매 조언',
      question: '내 게임에 맞는 클럽은 어떻게 고르나요?',
      answer:
        '현재 핸디캡, 스윙 스피드, 자주 나는 미스를 먼저 기준으로 보세요. 초중급 골퍼는 관용성이 좋은 헤드, 중간 탄도 샤프트, 단순한 세트 구성이 도움이 되는 경우가 많습니다. 두 옵션 사이에서 고민된다면 발사와 일관성을 먼저 도와주는 쪽을 고르세요.',
      audience: '모든 골퍼',
      featured: true,
    },
    {
      id: 'shipping-times',
      category: '배송',
      question: '배송은 보통 얼마나 걸리나요?',
      answer:
        '기본 배송은 보통 영업일 기준 3~5일, 빠른 배송은 1~2일 정도 걸립니다. 주문 금액이 $99를 넘으면 기본 배송이 무료입니다.',
      audience: '주문',
      featured: true,
    },
    {
      id: 'returns-window',
      category: '반품',
      question: '반품 가능 기간은 어떻게 되나요?',
      answer:
        '대부분의 미사용 상품은 30일 이내 반품 가능합니다. 가능하면 원래 포장을 유지해 주시고, 상품 페이지에 별도 안내가 없는 한 각인 상품이나 사용한 상품은 제한될 수 있습니다.',
      audience: '주문',
      featured: true,
    },
    {
      id: 'shoe-sizing',
      category: '사이즈 가이드',
      question: '골프화는 러닝화와 같은 사이즈를 신으면 되나요?',
      answer:
        '대체로 중족부를 조금 더 단단히 잡아주는 경우가 많습니다. 두꺼운 골프 양말을 신거나 추운 날 플레이한다면, 평소 사이즈를 고르기 전에 너비와 깔창 공간을 함께 확인해 보세요.',
      audience: '의류',
      featured: false,
    },
    {
      id: 'order-tracking',
      category: '주문 조회',
      question: '주문 조회에는 무엇이 필요한가요?',
      answer:
        'GreenLinks 주문 번호와 결제에 사용한 이메일 주소가 필요합니다. 주문 직후라면 결제 확인과 출고 준비에 약간의 시간이 걸릴 수 있습니다.',
      audience: '주문',
      featured: false,
    },
    {
      id: 'contact-support',
      category: '문의',
      question: 'AI 도우미 대신 지원팀에 연락해야 하는 경우는 언제인가요?',
      answer:
        '주문 변경, 손상 배송, 계정 문제, 반품처럼 사람이 직접 후속 대응해야 하는 상황은 지원팀에 문의하세요. AI 도우미는 빠른 상품 추천과 정책 안내에 가장 적합합니다.',
      audience: '지원',
      featured: false,
    },
  ],
  uz: [
    {
      id: 'fit-clubs',
      category: 'Xarid bo‘yicha maslahat',
      question: 'O‘yinimga mos klubni qanday tanlayman?',
      answer:
        'Avval hozirgi handicap, sving tezligi va odatiy xatoni hisobga oling. Ko‘pchilik yangi o‘yinchilarga forgiving boshlar, o‘rta launch mil va sodda set tarkibi ko‘proq foyda beradi. Ikki variant orasida qolsangiz, launch va barqarorlikni yaxshiroq beradiganini tanlang.',
      audience: 'Barcha golferlar',
      featured: true,
    },
    {
      id: 'shipping-times',
      category: 'Yetkazib berish',
      question: 'Yetkazib berish odatda qancha vaqt oladi?',
      answer:
        'Standart yetkazib berish odatda 3 dan 5 ish kunigacha, tezkor yetkazib berish esa 1 dan 2 ish kunigacha davom etadi. $99 dan yuqori buyurtmalar standart yetkazib berishda bepul.',
      audience: 'Buyurtmalar',
      featured: true,
    },
    {
      id: 'returns-window',
      category: 'Qaytarish',
      question: 'Qaytarish muddati qancha?',
      answer:
        'Ko‘p ishlatilmagan mahsulotlarni 30 kun ichida qaytarish mumkin. Iloji bo‘lsa asl qadoqni saqlang va mahsulot sahifasida boshqacha yozilmagan bo‘lsa, shaxsiylashtirilgan yoki ishlatilgan buyumlar cheklanishi mumkinligini yodda tuting.',
      audience: 'Buyurtmalar',
      featured: true,
    },
    {
      id: 'shoe-sizing',
      category: 'O‘lcham qo‘llanmasi',
      question: 'Golf poyabzali yugurish poyabzali bilan bir xil keladimi?',
      answer:
        'Ko‘pincha o‘rta qismida biroz mahkamroq turadi. Qalinroq golf paypoqlari kiysangiz yoki sovuq havoda o‘ynasangiz, odatiy o‘lchamni olishdan oldin kenglik va ichki joyni tekshiring.',
      audience: 'Kiyim',
      featured: false,
    },
    {
      id: 'order-tracking',
      category: 'Buyurtmani kuzatish',
      question: 'Buyurtmani kuzatish uchun nimalar kerak?',
      answer:
        'GreenLinks buyurtma raqami va checkout da ishlatilgan email manzili kerak bo‘ladi. Buyurtma juda yangi bo‘lsa, to‘lov tasdig‘i va ombor jarayoni uchun ozroq vaqt bering.',
      audience: 'Buyurtmalar',
      featured: false,
    },
    {
      id: 'contact-support',
      category: 'Bog‘lanish',
      question: 'Qachon AI yordamchisi o‘rniga support ga yozish kerak?',
      answer:
        'Buyurtma o‘zgarishi, shikastlangan yetkazib berish, hisob muammolari, qaytarish va inson nazorati kerak bo‘lgan holatlarda support ga murojaat qiling. AI yordamchisi tezkor mahsulot va siyosat bo‘yicha yo‘riqnoma uchun qulay.',
      audience: 'Yordam',
      featured: false,
    },
  ],
};

@Injectable()
export class SupportService {
  private readonly inMemoryTickets: SupportTicket[] = [];

  constructor(
    @Inject(ORDER_READER)
    private readonly orderReader: OrderReader,
    @Optional()
    @InjectRepository(SupportTicket)
    private readonly ticketRepository?: Repository<SupportTicket>,
  ) {}

  listFaqs(input: SupportFaqsQueryInput): PaginatedSupportFaqs {
    const normalizedLocale = input.locale?.trim().toLowerCase().startsWith('ko')
      ? 'ko'
      : input.locale?.trim().toLowerCase().startsWith('uz')
        ? 'uz'
        : 'en';
    const normalizedCategory = input.category?.trim().toLowerCase();
    const faqs = FAQS_BY_LOCALE[normalizedLocale] ?? FAQS_BY_LOCALE.en;
    const filtered = faqs.filter((item) => {
      if (input.featuredOnly && !item.featured) {
        return false;
      }
      if (normalizedCategory && normalizedCategory !== 'all') {
        return item.category.toLowerCase() === normalizedCategory;
      }
      return true;
    });

    const start = (input.page - 1) * input.limit;
    return {
      items: filtered.slice(start, start + input.limit),
      total: filtered.length,
      page: input.page,
      limit: input.limit,
    };
  }

  async createSupportRequest(
    input: CreateSupportRequestInput,
  ): Promise<SupportTicketResponse> {
    const name = input.name?.trim() ?? '';
    const email = input.email?.trim().toLowerCase() ?? '';
    const topic = input.topic?.trim() ?? '';
    const message = input.message?.trim() ?? '';
    const orderNumber = input.orderNumber?.trim() || null;

    if (!name || !email || !topic || !message) {
      throw new BadRequestException('Please fill in all required fields.');
    }

    const ticketData: Partial<SupportTicket> = {
      referenceNumber: this.makeReferenceNumber(),
      name,
      email,
      topic,
      orderNumber,
      message,
      status: 'OPEN',
    };

    if (this.ticketRepository) {
      const entity = this.ticketRepository.create(ticketData);
      const saved = await this.ticketRepository.save(entity);
      return this.toSupportTicketResponse(saved);
    }

    const now = new Date();
    const fallback: SupportTicket = {
      id: crypto.randomUUID(),
      referenceNumber: ticketData.referenceNumber!,
      name,
      email,
      topic,
      orderNumber,
      message,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };
    this.inMemoryTickets.unshift(fallback);
    return this.toSupportTicketResponse(fallback);
  }

  async lookupOrder(input: SupportOrderLookupInput): Promise<SupportOrderStatus> {
    const normalizedOrder = input.orderNumber.trim();
    const normalizedEmail = input.email.trim().toLowerCase();
    const order = await this.orderReader.getOrderByNumber(normalizedOrder);

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.contactEmail.trim().toLowerCase() !== normalizedEmail) {
      throw new BadRequestException(
        'Order number and email do not match our records.',
      );
    }

    return {
      orderNumber: order.orderNumber,
      placedAtIso: order.placedAtIso,
      status: this.resolveStatus(order.placedAtIso),
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      deliveryName: order.deliveryName,
      deliveryCity: order.deliveryCity,
      deliveryRegion: order.deliveryRegion,
      deliveryCountry: order.deliveryCountry,
      total: order.total,
      items: order.items.map((item) => ({
        id: item.id,
        brand: item.brand,
        name: item.name,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    };
  }

  private resolveStatus(placedAtIso: string): string {
    const ageMs = Date.now() - new Date(placedAtIso).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < 1) return 'Processing';
    if (ageDays < 3) return 'Packed';
    if (ageDays < 6) return 'In Transit';
    return 'Delivered';
  }

  private makeReferenceNumber(): string {
    const stamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `SUP-${stamp}-${random}`;
  }

  private toSupportTicketResponse(ticket: SupportTicket): SupportTicketResponse {
    return {
      referenceNumber: ticket.referenceNumber,
      status: ticket.status,
      topic: ticket.topic,
      orderNumber: ticket.orderNumber,
      createdAt: ticket.createdAt,
    };
  }
}
