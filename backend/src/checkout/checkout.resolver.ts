import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FindCheckoutOrderInput } from './dto/find-checkout-order.input';
import { PlaceOrderInput } from './dto/place-order.input';
import { CheckoutService } from './checkout.service';
import { Order } from './entities/order.entity';

@Resolver()
export class CheckoutResolver {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Mutation(() => Order)
  placeOrder(@Args('input') input: PlaceOrderInput): Promise<Order> {
    return this.checkoutService.placeOrder(input);
  }

  @Query(() => Order, { nullable: true })
  checkoutOrderByNumber(
    @Args('input') input: FindCheckoutOrderInput,
  ): Promise<Order | null> {
    return this.checkoutService.getOrderByNumber(input.orderNumber);
  }
}
