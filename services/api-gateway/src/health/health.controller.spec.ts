import { describe, it, expect, vi } from 'vitest';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('reports ok status when the database is reachable', async () => {
    const fakeHealthService = {
      checkDatabase: vi.fn().mockResolvedValue({ connected: true }),
    } as unknown as HealthService;

    const controller = new HealthController(fakeHealthService);
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api-gateway');
    expect(result.database.connected).toBe(true);
  });

  it('reports degraded status when the database is unreachable', async () => {
    const fakeHealthService = {
      checkDatabase: vi.fn().mockResolvedValue({
        connected: false,
        error: 'connection refused',
      }),
    } as unknown as HealthService;

    const controller = new HealthController(fakeHealthService);
    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.database.connected).toBe(false);
  });
});
