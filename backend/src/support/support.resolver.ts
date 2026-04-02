import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateSupportRequestInput } from './dto/create-support-request.input';
import { SupportFaqsQueryInput } from './dto/support-faqs-query.input';
import { SupportOrderLookupInput } from './dto/support-order-lookup.input';
import { PaginatedSupportFaqs } from './models/paginated-support-faqs.model';
import { SupportFaq } from './models/support-faq.model';
import { SupportOrderStatus } from './models/support-order-status.model';
import { SupportTicketResponse } from './models/support-ticket-response.model';
import { SupportService } from './support.service';

@Resolver()
export class SupportResolver {
  constructor(private readonly supportService: SupportService) {}

  @Query(() => PaginatedSupportFaqs)
  supportFaqs(
    @Args('input', { nullable: true }) input?: SupportFaqsQueryInput,
  ): PaginatedSupportFaqs {
    return this.supportService.listFaqs(input ?? new SupportFaqsQueryInput());
  }

  @Mutation(() => SupportTicketResponse)
  submitSupportRequest(
    @Args('input') input: CreateSupportRequestInput,
  ): Promise<SupportTicketResponse> {
    return this.supportService.createSupportRequest(input);
  }

  @Query(() => SupportOrderStatus)
  supportOrderLookup(
    @Args('input') input: SupportOrderLookupInput,
  ): Promise<SupportOrderStatus> {
    return this.supportService.lookupOrder(input);
  }
}
