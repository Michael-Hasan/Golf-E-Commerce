import { Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';

type HealthStatus = {
  status: 'ok' | 'degraded';
  timestamp: string;
  checks: Record<string, 'up' | 'down'>;
};

@Injectable()
export class HealthService {
  constructor(@Optional() private readonly dataSource?: DataSource) {}

  getLiveness(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        app: 'up',
      },
    };
  }

  async getReadiness(): Promise<HealthStatus> {
    const dbEnabled = process.env.USE_IN_MEMORY_DB === '0';
    const dbStatus =
      !dbEnabled
        ? 'up'
        : this.dataSource?.isInitialized
          ? ((await this.pingDatabase()) ? 'up' : 'down')
          : 'down';

    return {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        app: 'up',
        database: dbStatus,
      },
    };
  }

  async getHealth(): Promise<HealthStatus> {
    return this.getReadiness();
  }

  private async pingDatabase(): Promise<boolean> {
    if (!this.dataSource) {
      return false;
    }

    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
