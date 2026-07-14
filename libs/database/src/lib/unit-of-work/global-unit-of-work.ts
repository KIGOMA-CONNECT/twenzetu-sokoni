import { IUnitOfWork } from '@abms/kernel';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmTransactionContext } from './transaction-context';

/**
 * For flows that must run before any tenant is known — tenant registration and
 * login (see ADR-0005) — where TenantAwareUnitOfWork would throw
 * TenantContextMissingException. No `set_config('app.tenant_id', ...)` call,
 * matching the fact that Tenant/User tables are deliberately outside RLS.
 */
@Injectable()
export class GlobalUnitOfWork implements IUnitOfWork {
  public constructor(private readonly dataSource: DataSource) {}

  public async withTransaction<T>(
    work: (ctx: TypeOrmTransactionContext) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(new TypeOrmTransactionContext(queryRunner.manager));
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
