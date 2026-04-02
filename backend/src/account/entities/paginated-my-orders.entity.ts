import { Field, Int, ObjectType } from '@nestjs/graphql';
import { MyPageOrder } from './my-page.entity';

@ObjectType()
export class PaginatedMyOrders {
  @Field(() => [MyPageOrder])
  items: MyPageOrder[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
