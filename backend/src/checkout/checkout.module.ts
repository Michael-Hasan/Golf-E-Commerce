import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from '../jobs/jobs.module';
import { ORDER_READER } from '../shared/contracts/order-reader.contract';
import { CheckoutResolver } from './checkout.resolver';
import { Order } from './entities/order.entity';
import { OrderJobsService } from './order-jobs.service';
import { OrderPersistenceService } from './order-persistence.service';
import { CheckoutService } from './checkout.service';

const useInMemoryDb = process.env.USE_IN_MEMORY_DB !== '0';

@Module({
  imports: [
    JobsModule,
    ...(useInMemoryDb ? [] : [TypeOrmModule.forFeature([Order])]),
  ],
  providers: [
    CheckoutResolver,
    CheckoutService,
    OrderJobsService,
    OrderPersistenceService,
    { provide: ORDER_READER, useExisting: CheckoutService },
  ],
  exports: [ORDER_READER],
})
export class CheckoutModule {}
