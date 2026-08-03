import type { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('checkLiveness() reports ok without touching the database', () => {
    const dataSource = { query: jest.fn() } as unknown as DataSource;
    const controller = new HealthController(dataSource);

    expect(controller.checkLiveness()).toEqual({ status: 'ok' });
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('checkDatabase() performs a live round trip and reports reachable', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as unknown as DataSource;
    const controller = new HealthController(dataSource);

    const result = await controller.checkDatabase();

    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    expect(result).toEqual({ status: 'ok', database: 'reachable' });
  });
});
