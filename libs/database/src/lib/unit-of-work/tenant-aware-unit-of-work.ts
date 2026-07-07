import { IUnitOfWork } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantContextMissingException } from './tenant-context-missing.exception';
import { TypeOrmTransactionContext } from './transaction-context';

@Injectable()
export class TenantAwareUnitOfWork implements IUnitOfWork {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {}

  public async withTransaction<T>(
    work: (ctx: TypeOrmTransactionContext) => Promise<T>,
  ): Promise<T> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new TenantContextMissingException();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
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
