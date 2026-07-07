import { ITransactionContext } from '@abms/kernel';
import { randomUUID } from 'node:crypto';
import { EntityManager } from 'typeorm';

export class TypeOrmTransactionContext implements ITransactionContext {
  public readonly correlationId: string;
  public readonly manager: EntityManager;

  public constructor(manager: EntityManager) {
    this.manager = manager;
    this.correlationId = randomUUID();
  }
}
