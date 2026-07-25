import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { MicroLoan, IMicroLoanRepository, LoanType, MicroLoanStatus } from '@afri-market/marketplace-domain';
import { MicroLoanOrmEntity } from '../entities/micro-loan-orm.entity';

@Injectable()
export class TypeOrmMicroLoanRepository extends TypeOrmRepository<MicroLoan, MicroLoanOrmEntity, EntityId> implements IMicroLoanRepository {
  constructor(manager: EntityManager) {
    super(manager, MicroLoanOrmEntity);
  }

  public async findById(id: EntityId): Promise<MicroLoan | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByBorrowerId(borrowerId: string): Promise<MicroLoan[]> {
    const entities = await this.repository.find({ where: { borrowerId } });
    return entities.map(e => this.toDomain(e));
  }

  public async findActiveByTenant(tenantId: string): Promise<MicroLoan[]> {
    const entities = await this.repository.createQueryBuilder('ml')
      .where('ml.tenant_id = :tenantId', { tenantId })
      .andWhere('ml.status IN (:...statuses)', { statuses: ['APPROVED', 'DISBURSED'] })
      .getMany();
    return entities.map(e => this.toDomain(e));
  }

  public async save(entity: MicroLoan): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as MicroLoanOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: MicroLoanOrmEntity): MicroLoan {
    return MicroLoan.reconstitute(EntityId.from(e.id), {
      tenantId: TenantId.create(e.tenantId),
      borrowerId: EntityId.from(e.borrowerId),
      borrowerType: e.borrowerType as 'vendor' | 'driver',
      loanType: e.loanType as LoanType,
      requestedAmount: Money.create(Number(e.requestedAmount), e.currency),
      approvedAmount: e.approvedAmount != null ? Money.create(Number(e.approvedAmount), e.currency) : undefined,
      interestRate: Number(e.interestRate),
      outstandingBalance: Money.create(Number(e.outstandingBalance), e.currency),
      dailyRepaymentAmount: Money.create(Number(e.dailyRepaymentAmount), e.currency),
      totalDays: e.totalDays,
      repaidDays: e.repaidDays,
      status: e.status as MicroLoanStatus,
      disbursedAt: e.disbursedAt ?? undefined,
      dueAt: e.dueAt ?? undefined,
      version: e.version,
    });
  }

  private toOrm(entity: MicroLoan): Partial<MicroLoanOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      borrowerId: entity.borrowerId.value,
      borrowerType: entity.borrowerType,
      loanType: entity.loanType,
      requestedAmount: entity.requestedAmount.amount,
      approvedAmount: entity.approvedAmount?.amount ?? null,
      interestRate: entity.interestRate,
      currency: entity.requestedAmount.currency,
      outstandingBalance: entity.outstandingBalance.amount,
      dailyRepaymentAmount: entity.dailyRepaymentAmount.amount,
      totalDays: entity.totalDays,
      repaidDays: entity.repaidDays,
      status: entity.status,
      version: entity.version,
    };
  }
}
