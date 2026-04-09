import { Injectable } from '@nestjs/common';
import type { SaleProduct } from '../sales/models/sale-product.model';
import type { CatalogItem } from './types/catalog-context';

@Injectable()
export class AiPromptBuilderService {
  private readonly catalogLimit = 35;
  private readonly saleHighlightLimit = 8;

  buildSystemPrompt(
    language: 'en' | 'ko' | 'uz',
    catalog: CatalogItem[],
    saleProducts: SaleProduct[],
  ): string {
    const catalogSection = this.formatCatalogItems(catalog);
    const saleSection = this.formatSaleHighlights(saleProducts);
    const languageInstruction = this.getLanguageInstruction(language);

    return `You are GreenLinks AI, a premium golf e-commerce assistant.
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
${catalogSection}

Sale highlights:
${saleSection}`;
  }

  private formatCatalogItems(catalog: CatalogItem[]): string {
    if (!catalog.length) {
      return 'No catalog data available.';
    }
    const top = [...catalog]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, this.catalogLimit)
      .map(
        (item) =>
          `${item.source} | ${item.category} | ${item.brand} ${item.name} | $${item.price.toFixed(2)} | rating ${item.rating.toFixed(1)}`,
      );
    return top.join('\n');
  }

  private formatSaleHighlights(saleProducts: SaleProduct[]): string {
    if (!saleProducts.length) {
      return 'No sale highlights available.';
    }
    return saleProducts
      .slice(0, this.saleHighlightLimit)
      .map(
        (item) =>
          `${item.brand} ${item.name}: $${item.salePrice.toFixed(2)} (was $${item.originalPrice.toFixed(2)})`,
      )
      .join('\n');
  }

  private getLanguageInstruction(language: 'en' | 'ko' | 'uz'): string {
    if (language === 'ko') {
      return 'Write your answer in Korean. Keep suggestions in Korean too.';
    }
    if (language === 'uz') {
      return "Javobingizni o‘zbek tilida yozing. Tavsiyalarni ham o‘zbek tilida bering.";
    }
    return 'Write your answer in English. Keep suggestions in English too.';
  }
}
