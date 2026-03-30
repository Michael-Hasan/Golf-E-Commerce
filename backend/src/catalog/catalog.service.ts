import {
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogProduct } from './catalog-product.entity';
import { CreateCatalogProductInput } from './dto/create-catalog-product.input';
import { UpdateCatalogProductInput } from './dto/update-catalog-product.input';

@Injectable()
export class CatalogService {
  constructor(
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

  async adminListProducts(): Promise<CatalogProduct[]> {
    if (!this.catalogRepo) {
      return [];
    }
    return this.catalogRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async adminCreateProduct(input: CreateCatalogProductInput): Promise<CatalogProduct> {
    const catalogRepo = this.requireRepo();
    const entity = catalogRepo.create({
      ...input,
      category: input.category.trim(),
      brand: input.brand.trim(),
      name: input.name.trim(),
      badge: input.badge?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      description: input.description?.trim() || null,
      reviewCount: input.reviewCount ?? 0,
      rating: input.rating ?? 0,
      isFeatured: input.isFeatured ?? false,
      isActive: input.isActive ?? true,
    });
    return catalogRepo.save(entity);
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
          : input.imageUrl?.trim() || null,
      description:
        input.description === undefined
          ? existing.description
          : input.description?.trim() || null,
    });

    return catalogRepo.save(existing);
  }

  async adminDeleteProduct(id: string): Promise<boolean> {
    const catalogRepo = this.requireRepo();
    const result = await catalogRepo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
