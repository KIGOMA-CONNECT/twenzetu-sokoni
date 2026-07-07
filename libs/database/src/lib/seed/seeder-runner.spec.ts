import type { EntityManager } from 'typeorm';
import { ISeeder } from './seeder.interface';
import { SeederRunner } from './seeder-runner';

function fakeSeeder(name: string, order: number, shouldRun: boolean): jest.Mocked<ISeeder> {
  return {
    name,
    order,
    shouldRun: jest.fn().mockResolvedValue(shouldRun),
    run: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SeederRunner', () => {
  const manager = {} as EntityManager;

  it('reports zero seeders executed for an empty registry', async () => {
    const runner = new SeederRunner([]);

    const summary = await runner.run(manager);

    expect(summary.executed).toEqual([]);
  });

  it('runs only the seeders whose shouldRun() resolves true', async () => {
    const skip = fakeSeeder('skip-me', 1, false);
    const run = fakeSeeder('run-me', 2, true);
    const runner = new SeederRunner([skip, run]);

    const summary = await runner.run(manager);

    expect(skip.run).not.toHaveBeenCalled();
    expect(run.run).toHaveBeenCalledWith(manager);
    expect(summary.executed).toEqual(['run-me']);
  });

  it('runs seeders in ascending order regardless of registration order', async () => {
    const executionOrder: string[] = [];
    const second = fakeSeeder('second', 2, true);
    second.run.mockImplementation(async () => {
      executionOrder.push('second');
    });
    const first = fakeSeeder('first', 1, true);
    first.run.mockImplementation(async () => {
      executionOrder.push('first');
    });

    const runner = new SeederRunner([second, first]);
    await runner.run(manager);

    expect(executionOrder).toEqual(['first', 'second']);
  });
});
