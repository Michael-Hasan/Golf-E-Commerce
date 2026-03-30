import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateSupportRequestInput } from './dto/create-support-request.input';
import { SupportFaq } from './models/support-faq.model';
import { SupportOrderStatus } from './models/support-order-status.model';
import { SupportService } from './support.service';
import { SupportTicket } from './support-ticket.entity';

@Resolver()
export class SupportResolver {
  constructor(private readonly supportService: SupportService) {}

  @Query(() => [SupportFaq])
  supportFaqs(
    @Args('locale', { nullable: true }) locale?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('featuredOnly', { nullable: true }) featuredOnly?: boolean,
  ): SupportFaq[] {
    return this.supportService.listFaqs(locale, category, featuredOnly);
  }

  @Mutation(() => SupportTicket)
  submitSupportRequest(
    @Args('input') input: CreateSupportRequestInput,
  ): Promise<SupportTicket> {
    return this.supportService.createSupportRequest(input);
  }

  @Query(() => SupportOrderStatus)
  supportOrderLookup(
    @Args('orderNumber') orderNumber: string,
    @Args('email') email: string,
  ): SupportOrderStatus {
    return this.supportService.lookupOrder(orderNumber, email);
  }
}
