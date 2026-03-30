import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CatalogProduct } from './catalog-product.entity';
import { CatalogService } from './catalog.service';
import { CreateCatalogProductInput } from './dto/create-catalog-product.input';
import { UpdateCatalogProductInput } from './dto/update-catalog-product.input';

@Resolver()
@UseGuards(GqlAuthGuard, AdminGuard)
export class CatalogResolver {
  constructor(private readonly catalogService: CatalogService) {}

  @Query(() => [CatalogProduct])
  adminCatalogProducts(): Promise<CatalogProduct[]> {
    return this.catalogService.adminListProducts();
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
