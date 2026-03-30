import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PlaceOrderInput } from './dto/place-order.input';
import { CheckoutService } from './checkout.service';
import { CheckoutOrderResult } from './models/order-result.model';

@Resolver()
export class CheckoutResolver {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Mutation(() => CheckoutOrderResult)
  placeOrder(@Args('input') input: PlaceOrderInput): CheckoutOrderResult {
    return this.checkoutService.placeOrder(input);
  }

  @Query(() => CheckoutOrderResult, { nullable: true })
  checkoutOrderByNumber(
    @Args('orderNumber') orderNumber: string,
  ): CheckoutOrderResult | null {
    return this.checkoutService.getOrderByNumber(orderNumber);
  }
}
