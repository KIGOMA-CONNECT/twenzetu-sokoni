import { ITransactionContext, IUnitOfWork } from '@afri-market/kernel';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantContextMissingException } from './tenant-context-missing.exception';
import { TypeOrmTransactionContext } from './transaction-context';

export const TENANT_CONTEXT_STORE = 'TENANT_CONTEXT_STORE';

export interface ITenantContextStore {
  getTenantId(): string | null;
}

@Injectable()
export class TenantAwareUnitOfWork implements IUnitOfWork {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(TENANT_CONTEXT_STORE) private readonly tenantContext: ITenantContextStore,
  ) {}

  public async withTransaction<T>(
    work: (ctx: ITransactionContext) => Promise<T>,
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
