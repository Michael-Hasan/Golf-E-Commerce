import { Controller, Get, Header, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Version([VERSION_NEUTRAL, '1'])
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics(): string {
    return this.metricsService.snapshot();
  }
}
