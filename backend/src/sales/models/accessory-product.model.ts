import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AccessoryProduct {
  @Field()
  id: string;

  @Field()
  category: string;

  @Field()
  brand: string;

  @Field()
  name: string;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  reviewCount: number;

  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  originalPrice?: number;

  @Field({ nullable: true })
  badge?: string;

  @Field({ nullable: true })
  imageUrl?: string;
}

@ObjectType()
export class AccessoryProductsResult {
  @Field(() => [AccessoryProduct])
  items: AccessoryProduct[];

  @Field(() => Int)
  total: number;
}
