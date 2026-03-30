import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SupportOrderLineItem {
  @Field()
  id: string;

  @Field()
  brand: string;

  @Field()
  name: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  lineTotal: number;
}

@ObjectType()
export class SupportOrderStatus {
  @Field()
  orderNumber: string;

  @Field()
  placedAtIso: string;

  @Field()
  status: string;

  @Field()
  shippingMethod: string;

  @Field()
  paymentMethod: string;

  @Field()
  deliveryName: string;

  @Field()
  deliveryCity: string;

  @Field()
  deliveryRegion: string;

  @Field()
  deliveryCountry: string;

  @Field(() => Float)
  total: number;

  @Field(() => [SupportOrderLineItem])
  items: SupportOrderLineItem[];
}
