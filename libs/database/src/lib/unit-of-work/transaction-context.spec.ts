import type { EntityManager } from 'typeorm';
import { TypeOrmTransactionContext } from './transaction-context';

describe('TypeOrmTransactionContext', () => {
  it('exposes the given manager and a generated correlation id', () => {
    const manager = {} as EntityManager;

    const ctx = new TypeOrmTransactionContext(manager);

    expect(ctx.manager).toBe(manager);
    expect(ctx.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates a distinct correlation id per instance', () => {
    const manager = {} as EntityManager;

    const a = new TypeOrmTransactionContext(manager);
    const b = new TypeOrmTransactionContext(manager);

    expect(a.correlationId).not.toBe(b.correlationId);
  });
});
