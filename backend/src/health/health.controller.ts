import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version([VERSION_NEUTRAL, '1'])
  health() {
    return this.healthService.getHealth();
  }

  @Get('live')
  @Version([VERSION_NEUTRAL, '1'])
  liveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @Version([VERSION_NEUTRAL, '1'])
  readiness() {
    return this.healthService.getReadiness();
  }
}
