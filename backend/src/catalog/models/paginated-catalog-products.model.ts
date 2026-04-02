import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CatalogProduct } from '../catalog-product.entity';

@ObjectType()
export class PaginatedCatalogProducts {
  @Field(() => [CatalogProduct])
  items: CatalogProduct[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
