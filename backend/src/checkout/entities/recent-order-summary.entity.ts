import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RecentOrderSummary {
  @Field()
  orderNumber: string;

  @Field()
  orderDate: string;

  @Field(() => Int)
  itemCount: number;

  @Field()
  status: string;

  @Field(() => Float)
  totalAmount: number;
}
