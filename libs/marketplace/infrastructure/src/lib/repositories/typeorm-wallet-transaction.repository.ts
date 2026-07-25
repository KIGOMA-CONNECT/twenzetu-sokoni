import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WalletTransaction, IWalletTransactionRepository } from '@afri-market/marketplace-domain';
import { WalletTransactionOrmEntity } from '../entities/wallet-transaction-orm.entity';

@Injectable()
export class TypeOrmWalletTransactionRepository extends TypeOrmRepository<WalletTransaction, WalletTransactionOrmEntity, EntityId> implements IWalletTransactionRepository {
  constructor(manager: EntityManager) {
    super(manager, WalletTransactionOrmEntity);
  }

  public async findById(id: EntityId): Promise<WalletTransaction | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByOwnerId(
    tenantId: string,
    ownerId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<{ data: WalletTransaction[]; total: number }> {
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    const [entities, total] = await this.repository.findAndCount({
      where: { tenantId, ownerId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async save(entity: WalletTransaction): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as WalletTransactionOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: WalletTransactionOrmEntity): WalletTransaction {
    return WalletTransaction.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      ownerId: EntityId.from(e.ownerId),
      ownerType: e.ownerType,
      type: e.type as 'CREDIT' | 'DEBIT',
      amount: Money.create(Number(e.amount), e.currency),
      balanceBefore: Number(e.balanceBefore),
      balanceAfter: Number(e.balanceAfter),
      description: e.description ?? '',
      referenceId: e.referenceId ?? undefined,
      referenceType: e.referenceType ?? undefined,
    });
  }

  private toOrm(entity: WalletTransaction): Partial<WalletTransactionOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      ownerId: entity.ownerId.value,
      ownerType: entity.ownerType,
      type: entity.type,
      amount: entity.amount.amount,
      currency: entity.amount.currency,
      balanceBefore: entity.balanceBefore,
      balanceAfter: entity.balanceAfter,
      description: entity.description,
      referenceId: entity.referenceId ?? null,
      referenceType: entity.referenceType ?? null,
    };
  }
}
