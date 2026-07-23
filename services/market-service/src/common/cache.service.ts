import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Thin wrapper around the shared Redis instance (already running via the
 * project's root docker-compose.yml - this is the first service to
 * actually use it). Used to cache market data briefly so we don't burn
 * through Twelve Data's free-tier rate limit every time a user's
 * dashboard refreshes - most Forex quotes don't meaningfully change
 * second to second for a retail intelligence tool like this one.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
