import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppLogger } from '../logging/logger.service';
import { JobsQueueService, JobEnvelope } from '../jobs/jobs-queue.service';

@Injectable()
export class OrderJobsService implements OnModuleInit {
  private readonly logger: AppLogger;

  constructor(
    private readonly jobsQueue: JobsQueueService,
    logger: AppLogger,
  ) {
    this.logger = logger.withContext(OrderJobsService.name);
  }

  onModuleInit(): void {
    this.jobsQueue.registerHandler('orders.process', this.processOrder.bind(this));
    this.jobsQueue.registerHandler(
      'email.order-confirmation',
      this.sendOrderConfirmation.bind(this),
    );
  }

  private async processOrder(job: JobEnvelope): Promise<void> {
    this.logger.log('Processing order job', {
      jobName: job.name,
      orderId: job.payload.orderId,
      orderNumber: job.payload.orderNumber,
    });

    await this.jobsQueue.enqueue('email.order-confirmation', {
      orderNumber: job.payload.orderNumber,
      recipientEmail: job.payload.contactEmail,
    });
  }

  private async sendOrderConfirmation(job: JobEnvelope): Promise<void> {
    this.logger.log('Sending order confirmation email', {
      jobName: job.name,
      orderNumber: job.payload.orderNumber,
      recipientEmail: job.payload.recipientEmail,
    });
  }
}
