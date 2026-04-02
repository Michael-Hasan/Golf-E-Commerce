import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type Bucket = {
  count: number;
  expiresAt: number;
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private readonly ttlMs = parseInt(process.env.RATE_LIMIT_TTL_MS ?? '60000', 10);
  private readonly maxRequests = parseInt(process.env.RATE_LIMIT_MAX ?? '120', 10);
  private readonly enabled =
    String(process.env.RATE_LIMIT_ENABLED ?? '').trim() === '0'
      ? false
      : process.env.NODE_ENV === 'production';

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.enabled) {
      next();
      return;
    }

    // Do not rate-limit low-risk operational endpoints.
    const path = req.originalUrl ?? req.url ?? '';
    if (
      path.startsWith('/health') ||
      path.startsWith('/v1/health') ||
      path.startsWith('/metrics') ||
      path.startsWith('/v1/metrics')
    ) {
      next();
      return;
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.expiresAt <= now) {
      this.buckets.set(key, {
        count: 1,
        expiresAt: now + this.ttlMs,
      });
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.maxRequests - 1);
      next();
      return;
    }

    if (existing.count >= this.maxRequests) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    existing.count += 1;
    this.buckets.set(key, existing);
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(this.maxRequests - existing.count, 0));
    next();
  }
}
