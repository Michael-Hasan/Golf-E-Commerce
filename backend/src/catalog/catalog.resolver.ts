import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CatalogProduct } from './catalog-product.entity';
import { CatalogService } from './catalog.service';
import { CatalogProductsQueryInput } from './dto/catalog-products-query.input';
import { CreateCatalogProductInput } from './dto/create-catalog-product.input';
import { UpdateCatalogProductInput } from './dto/update-catalog-product.input';
import { PaginatedCatalogProducts } from './models/paginated-catalog-products.model';

@Resolver()
@UseGuards(GqlAuthGuard, AdminGuard)
export class CatalogResolver {
  constructor(private readonly catalogService: CatalogService) {}

  @Query(() => PaginatedCatalogProducts)
  adminCatalogProducts(
    @Args('input', { nullable: true }) input?: CatalogProductsQueryInput,
  ): Promise<PaginatedCatalogProducts> {
    return this.catalogService.adminListProducts(input ?? new CatalogProductsQueryInput());
  }

  @Mutation(() => CatalogProduct)
  adminCreateCatalogProduct(
    @Args('input') input: CreateCatalogProductInput,
  ): Promise<CatalogProduct> {
    return this.catalogService.adminCreateProduct(input);
  }

  @Mutation(() => CatalogProduct)
  adminUpdateCatalogProduct(
    @Args('id') id: string,
    @Args('input') input: UpdateCatalogProductInput,
  ): Promise<CatalogProduct> {
    return this.catalogService.adminUpdateProduct(id, input);
  }

  @Mutation(() => Boolean)
  adminDeleteCatalogProduct(@Args('id') id: string): Promise<boolean> {
    return this.catalogService.adminDeleteProduct(id);
  }
}
