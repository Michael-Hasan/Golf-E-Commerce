import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MetricsService } from '../monitoring/metrics.service';
import { User } from '../users/user.entity';
import { AppLogger } from './logger.service';

type RequestWithUser = Request & { user?: User };

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger: AppLogger;
  private readonly metrics: MetricsService;

  constructor(logger: AppLogger, metrics: MetricsService) {
    this.logger = logger.withContext(RequestLoggingMiddleware.name);
    this.metrics = metrics;
  }

  use(req: RequestWithUser, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      this.metrics.incrementRequest();
      if (res.statusCode >= 400) {
        this.metrics.incrementError();
      }
      this.logger.log('Request completed', {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        userId: req.user?.id ?? null,
      });
    });

    next();
  }
}
