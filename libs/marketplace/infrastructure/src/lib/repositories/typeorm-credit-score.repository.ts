import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreditScore } from '@afri-market/marketplace-domain';
import { ICreditScoreRepository } from '@afri-market/marketplace-domain';
import { CreditScoreOrmEntity } from '../entities/credit-score-orm.entity';

@Injectable()
export class TypeOrmCreditScoreRepository extends TypeOrmRepository<CreditScore, CreditScoreOrmEntity, EntityId> implements ICreditScoreRepository {
  constructor(manager: EntityManager) {
    super(manager, CreditScoreOrmEntity);
  }

  public async findById(id: EntityId): Promise<CreditScore | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByUserId(userId: string): Promise<CreditScore | null> {
    const e = await this.repository.findOne({ where: { userId } });
    return e ? this.toDomain(e) : null;
  }

  public async save(entity: CreditScore): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as CreditScoreOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: CreditScoreOrmEntity): CreditScore {
    return CreditScore.reconstitute(EntityId.from(e.id), {
      tenantId: TenantId.create(e.tenantId),
      userId: EntityId.from(e.userId),
      score: e.score,
      totalTransactions: e.totalTransactions,
      totalRevenue: Money.create(Number(e.totalRevenue), 'TZS'),
      averageDailySales: Money.create(Number(e.averageDailySales), 'TZS'),
      accountAgeDays: e.accountAgeDays,
      missedDeliveries: e.missedDeliveries,
      disputeCount: e.disputeCount,
      lastCalculatedAt: e.lastCalculatedAt,
      version: e.version,
    });
  }

  private toOrm(entity: CreditScore): Partial<CreditScoreOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      userId: entity.userId.value,
      score: entity.score,
      totalTransactions: entity.totalTransactions,
      totalRevenue: entity.totalRevenue.amount,
      lastCalculatedAt: entity.lastCalculatedAt,
      version: entity.version,
    };
  }
}
