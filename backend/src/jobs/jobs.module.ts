import { Module } from '@nestjs/common';
import { JobsQueueService } from './jobs-queue.service';

@Module({
  providers: [JobsQueueService],
  exports: [JobsQueueService],
})
export class JobsModule {}
