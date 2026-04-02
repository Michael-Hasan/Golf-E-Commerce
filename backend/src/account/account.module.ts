import { Module } from '@nestjs/common';
import { CheckoutModule } from '../checkout/checkout.module';
import { JobsModule } from '../jobs/jobs.module';
import { UsersRootModule } from '../users/users-root.module';
import { AccountResolver } from './account.resolver';
import { AccountService } from './account.service';

@Module({
  imports: [
    UsersRootModule.forRoot({
      useInMemory: process.env.USE_IN_MEMORY_DB !== '0',
    }),
    CheckoutModule,
    JobsModule,
  ],
  providers: [AccountResolver, AccountService],
})
export class AccountModule {}
