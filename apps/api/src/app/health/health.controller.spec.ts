import type { DataSource } from 'typeorm';
import type { Cache } from 'cache-manager';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok when database and cache are reachable', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as unknown as DataSource;
    const cacheManager = { get: jest.fn().mockResolvedValue(undefined) } as unknown as Cache;
    const controller = new HealthController(dataSource, cacheManager);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database.status).toBe('ok');
    expect(result.redis.status).toBe('ok');
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('reports degraded when the database query fails', async () => {
    const dataSource = { query: jest.fn().mockRejectedValue(new Error('db down')) } as unknown as DataSource;
    const cacheManager = { get: jest.fn().mockResolvedValue(undefined) } as unknown as Cache;
    const controller = new HealthController(dataSource, cacheManager);

    const result = await controller.check();

    expect(result.database.status).toBe('error');
    expect(result.redis.status).toBe('ok');
    expect(result.status).toBe('degraded');
  });

  it('reports degraded when the cache manager throws', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as unknown as DataSource;
    const cacheManager = { get: jest.fn().mockRejectedValue(new Error('redis down')) } as unknown as Cache;
    const controller = new HealthController(dataSource, cacheManager);

    const result = await controller.check();

    expect(result.redis.status).toBe('error');
    expect(result.database.status).toBe('ok');
    expect(result.status).toBe('degraded');
  });
});
