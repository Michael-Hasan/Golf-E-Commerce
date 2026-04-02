import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CheckoutLineItem {
  @Field()
  id: string;

  @Field()
  brand: string;

  @Field()
  name: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  lineTotal: number;
}

@ObjectType()
export class CheckoutOrder {
  @Field()
  orderNumber: string;

  @Field()
  placedAtIso: string;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  shippingCost: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  total: number;

  @Field()
  currency: string;

  @Field()
  paymentMethod: string;

  @Field()
  shippingMethod: string;

  @Field()
  contactEmail: string;

  @Field()
  deliveryName: string;

  @Field()
  deliveryAddressLine1: string;

  @Field({ nullable: true })
  deliveryAddressLine2?: string;

  @Field()
  deliveryCity: string;

  @Field()
  deliveryRegion: string;

  @Field()
  deliveryPostalCode: string;

  @Field()
  deliveryCountry: string;

  @Field(() => [CheckoutLineItem])
  items: CheckoutLineItem[];
}
