import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SupportFaq } from './support-faq.model';

@ObjectType()
export class PaginatedSupportFaqs {
  @Field(() => [SupportFaq])
  items: SupportFaq[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
