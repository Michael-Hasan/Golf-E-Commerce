import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutModule } from '../checkout/checkout.module';
import { SupportResolver } from './support.resolver';
import { SupportService } from './support.service';
import { SupportTicket } from './support-ticket.entity';

const useInMemoryDb = process.env.USE_IN_MEMORY_DB !== '0';

@Module({
  imports: [
    CheckoutModule,
    ...(useInMemoryDb ? [] : [TypeOrmModule.forFeature([SupportTicket])]),
  ],
  providers: [SupportResolver, SupportService],
  exports: [SupportService],
})
export class SupportModule {}
