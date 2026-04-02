import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/user.entity';

@ObjectType()
export class MyPageStats {
  @Field(() => Int)
  totalOrders: number;

  @Field(() => Int)
  wishlistItems: number;

  @Field(() => Int)
  rewardPoints: number;
}

@ObjectType()
export class MyPageOrder {
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

@ObjectType()
export class MyPageWishlistItem {
  @Field()
  brand: string;

  @Field()
  productName: string;

  @Field(() => Float)
  price: number;
}

@ObjectType()
export class MyPageAddress {
  @Field()
  label: string;

  @Field()
  line1: string;

  @Field({ nullable: true })
  line2?: string;

  @Field()
  city: string;

  @Field()
  region: string;

  @Field()
  postalCode: string;

  @Field()
  country: string;

  @Field(() => Boolean)
  isDefault: boolean;
}

@ObjectType()
export class MyPageData {
  @Field(() => User)
  user: User;

  @Field()
  displayName: string;

  @Field()
  memberTier: string;

  @Field(() => MyPageStats)
  stats: MyPageStats;

  @Field(() => [MyPageOrder])
  recentOrders: MyPageOrder[];

  @Field(() => [MyPageWishlistItem])
  wishlist: MyPageWishlistItem[];

  @Field(() => [MyPageAddress])
  savedAddresses: MyPageAddress[];
}
