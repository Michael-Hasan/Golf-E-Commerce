import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SupportTicketResponse {
  @Field()
  referenceNumber: string;

  @Field()
  status: string;

  @Field()
  topic: string;

  @Field(() => String, { nullable: true })
  orderNumber?: string | null;

  @Field()
  createdAt: Date;
}
