import { ITransactionContext } from '@abms/kernel';
import { TypeOrmTransactionContext } from '@abms/database';
import { EntityManager } from 'typeorm';

// Handlers only ever run inside GlobalUnitOfWork/TenantAwareUnitOfWork.withTransaction,
// which always constructs a TypeOrmTransactionContext — the kernel-level
// ITransactionContext type just doesn't expose .manager since it must stay ORM-agnostic.
export function getEntityManager(ctx: ITransactionContext): EntityManager {
  return (ctx as TypeOrmTransactionContext).manager;
}
