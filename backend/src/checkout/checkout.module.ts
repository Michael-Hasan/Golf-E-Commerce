import { Module } from '@nestjs/common';
import { CheckoutResolver } from './checkout.resolver';
import { CheckoutService } from './checkout.service';

@Module({
  providers: [CheckoutResolver, CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
