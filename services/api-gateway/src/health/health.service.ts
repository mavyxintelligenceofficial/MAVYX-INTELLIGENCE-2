import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export interface DatabaseHealth {
  connected: boolean;
  error?: string;
}

/**
 * HealthService is responsible for one thing only: proving that this
 * service is actually alive and can reach the database it depends on.
 * Every other service in the platform will get a near-identical health
 * check, so this is the pattern to copy later.
 */
@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://mavyx:mavyx_dev_password@localhost:5432/mavyx_intelligence',
      max: 5,
      connectionTimeoutMillis: 3000,
    });
  }

  async checkDatabase(): Promise<DatabaseHealth> {
    try {
      await this.pool.query('SELECT 1');
      return { connected: true };
    } catch (err) {
      return { connected: false, error: (err as Error).message };
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
