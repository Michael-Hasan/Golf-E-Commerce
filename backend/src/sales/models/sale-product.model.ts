import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SaleProduct {
  @Field()
  id: string;

  @Field()
  category: string;

  /** Sidebar bucket: Clubs, Balls, Bags, Apparel, Accessories (matches Sale page filters). */
  @Field()
  saleGroup: string;

  @Field()
  brand: string;

  @Field()
  name: string;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  reviewCount: number;

  @Field(() => Float)
  salePrice: number;

  @Field(() => Float)
  originalPrice: number;

  @Field({ nullable: true })
  badge?: string;

  @Field({ nullable: true })
  imageUrl?: string;
}
