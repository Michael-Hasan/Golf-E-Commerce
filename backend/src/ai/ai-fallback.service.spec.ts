import { AiFallbackService } from './ai-fallback.service';
import type { AiCatalogContextService } from './ai-catalog-context.service';

const mockCatalogContext: Partial<AiCatalogContextService> = {
  getCatalogItems: jest.fn(() =>
    Promise.resolve([
      {
        id: 'club-1',
        source: 'CLUBS',
        category: 'Drivers',
        brand: 'Test',
        name: 'Driver Pro',
        price: 499.99,
        originalPrice: 0,
        rating: 4.5,
      },
    ]),
  ),
  getSaleProductsForPrompt: jest.fn(() =>
    Promise.resolve([
      {
        id: 'sale-1',
        category: 'Sale',
        saleGroup: 'Clubs',
        brand: 'Deal Brand',
        name: 'Sale Driver',
        rating: 4.8,
        reviewCount: 10,
        salePrice: 150,
        originalPrice: 200,
      },
    ] as any),
  ),
};

describe('AiFallbackService', () => {
  const service = new AiFallbackService(mockCatalogContext as AiCatalogContextService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds with shipping guidance for delivery keywords', async () => {
    const reply = await service.replyWithRules('How long is shipping?', 'en');
    expect(reply.answer).toContain('Standard shipping usually arrives');
    expect(reply.suggestions).toContain('What is your return policy?');
  });

  it('includes top deals for sale keywords', async () => {
    const reply = await service.replyWithRules('Show me the sale deals', 'en');
    expect(reply.answer).toContain('Top deals right now');
  });
});
