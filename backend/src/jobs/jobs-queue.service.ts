import { Injectable } from '@nestjs/common';
import { AppLogger } from '../logging/logger.service';

export type JobPayload = Record<string, unknown>;

export type JobEnvelope = {
  name: string;
  payload: JobPayload;
  enqueuedAt: string;
};

export type JobHandler = (job: JobEnvelope) => Promise<void>;

@Injectable()
export class JobsQueueService {
  private readonly logger: AppLogger;
  private readonly handlers = new Map<string, JobHandler>();

  constructor(logger: AppLogger) {
    this.logger = logger.withContext(JobsQueueService.name);
  }

  registerHandler(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
  }

  async enqueue(name: string, payload: JobPayload): Promise<void> {
    const job: JobEnvelope = {
      name,
      payload,
      enqueuedAt: new Date().toISOString(),
    };

    this.logger.log('Job enqueued', {
      jobName: name,
    });

    const handler = this.handlers.get(name);
    if (!handler) {
      this.logger.warn('No job handler registered', {
        jobName: name,
      });
      return;
    }

    setImmediate(() => {
      void handler(job).catch((error) => {
        this.logger.error('Job execution failed', {
          jobName: name,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      });
    });
  }
}
