import { ITransactionContext, IUnitOfWork } from '@afri-market/kernel';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmTransactionContext } from './transaction-context';

@Injectable()
export class GlobalUnitOfWork implements IUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  public async withTransaction<T>(
    work: (ctx: ITransactionContext) => Promise<T>,
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
