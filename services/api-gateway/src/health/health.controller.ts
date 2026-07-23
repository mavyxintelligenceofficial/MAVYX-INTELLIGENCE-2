import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    const database = await this.healthService.checkDatabase();

    return {
      status: database.connected ? 'ok' : 'degraded',
      service: 'api-gateway',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
