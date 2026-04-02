import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private requestCount = 0;
  private errorCount = 0;

  incrementRequest(): void {
    this.requestCount += 1;
  }

  incrementError(): void {
    this.errorCount += 1;
  }

  snapshot(): string {
    return [
      '# HELP backend_requests_total Total number of handled HTTP requests',
      '# TYPE backend_requests_total counter',
      `backend_requests_total ${this.requestCount}`,
      '# HELP backend_errors_total Total number of HTTP responses with error status',
      '# TYPE backend_errors_total counter',
      `backend_errors_total ${this.errorCount}`,
    ].join('\n');
  }
}
