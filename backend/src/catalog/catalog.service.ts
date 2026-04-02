import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppCacheService } from '../shared/cache/app-cache.service';
import { CatalogProduct } from './catalog-product.entity';
import { CreateCatalogProductInput } from './dto/create-catalog-product.input';
import { CatalogProductsQueryInput } from './dto/catalog-products-query.input';
import { UpdateCatalogProductInput } from './dto/update-catalog-product.input';
import { PaginatedCatalogProducts } from './models/paginated-catalog-products.model';

@Injectable()
export class CatalogService {
  private readonly cacheTtlMs = 60_000;
  private readonly cachePrefix = 'catalog:products:';

  constructor(
    private readonly cache: AppCacheService,
    @Optional()
    @InjectRepository(CatalogProduct)
    private readonly catalogRepo?: Repository<CatalogProduct>,
  ) {}

  private requireRepo(): Repository<CatalogProduct> {
    if (!this.catalogRepo) {
      throw new ServiceUnavailableException(
        'Catalog admin API requires PostgreSQL (set USE_IN_MEMORY_DB=0).',
      );
    }
    return this.catalogRepo;
  }

  async adminListProducts(input: CatalogProductsQueryInput): Promise<PaginatedCatalogProducts> {
    if (!this.catalogRepo) {
      return {
        items: [],
        total: 0,
        page: input.page,
        limit: input.limit,
      };
    }

    const catalogRepo = this.catalogRepo;
    const cacheKey = `${this.cachePrefix}${input.page}:${input.limit}:${input.includeInactive}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const [items, total] = await catalogRepo.findAndCount({
        where: input.includeInactive ? {} : { isActive: true },
        order: {
          createdAt: 'DESC',
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });

      return {
        items,
        total,
        page: input.page,
        limit: input.limit,
      };
    }, { ttlMs: this.cacheTtlMs });
  }

  async adminCreateProduct(input: CreateCatalogProductInput): Promise<CatalogProduct> {
    const catalogRepo = this.requireRepo();
    const entity = catalogRepo.create({
      ...input,
      category: input.category.trim(),
      brand: input.brand.trim(),
      name: input.name.trim(),
      badge: input.badge?.trim() || null,
      imageUrl: this.normalizeImageUrl(input.imageUrl),
      description: input.description?.trim() || null,
      reviewCount: input.reviewCount ?? 0,
      rating: input.rating ?? 0,
      isFeatured: input.isFeatured ?? false,
      isActive: input.isActive ?? true,
    });
    const saved = await catalogRepo.save(entity);
    await this.cache.deleteByPrefix(this.cachePrefix);
    return saved;
  }

  async adminUpdateProduct(
    id: string,
    input: UpdateCatalogProductInput,
  ): Promise<CatalogProduct> {
    const catalogRepo = this.requireRepo();
    const existing = await catalogRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Catalog product not found');
    }

    Object.assign(existing, {
      ...input,
      category: input.category?.trim() ?? existing.category,
      brand: input.brand?.trim() ?? existing.brand,
      name: input.name?.trim() ?? existing.name,
      badge: input.badge === undefined ? existing.badge : input.badge?.trim() || null,
      imageUrl:
        input.imageUrl === undefined
          ? existing.imageUrl
          : this.normalizeImageUrl(input.imageUrl),
      description:
        input.description === undefined
          ? existing.description
          : input.description?.trim() || null,
    });

    const saved = await catalogRepo.save(existing);
    await this.cache.deleteByPrefix(this.cachePrefix);
    return saved;
  }

  async adminDeleteProduct(id: string): Promise<boolean> {
    const catalogRepo = this.requireRepo();
    const result = await catalogRepo.delete({ id });
    await this.cache.deleteByPrefix(this.cachePrefix);
    return (result.affected ?? 0) > 0;
  }

  private normalizeImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) {
      return null;
    }

    const normalized = imageUrl.trim();
    if (/^https?:\/\//i.test(normalized)) {
      return normalized;
    }

    throw new BadRequestException(
      'Catalog product images must use absolute CDN URLs (Cloudinary, S3, etc.).',
    );
  }
}
