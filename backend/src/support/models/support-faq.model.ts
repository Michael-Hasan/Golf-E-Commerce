import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SupportFaq {
  @Field()
  id: string;

  @Field()
  category: string;

  @Field()
  question: string;

  @Field()
  answer: string;

  @Field()
  audience: string;

  @Field()
  featured: boolean;
}
