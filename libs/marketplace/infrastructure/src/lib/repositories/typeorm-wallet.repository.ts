import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Wallet, IWalletRepository } from '@afri-market/marketplace-domain';
import { WalletOrmEntity } from '../entities/wallet-orm.entity';

@Injectable()
export class TypeOrmWalletRepository extends TypeOrmRepository<Wallet, WalletOrmEntity, EntityId> implements IWalletRepository {
  constructor(manager: EntityManager) {
    super(manager, WalletOrmEntity);
  }

  public async findById(id: EntityId): Promise<Wallet | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByOwnerId(ownerId: string): Promise<Wallet | null> {
    const entity = await this.repository.findOne({ where: { ownerId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async save(entity: Wallet): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as WalletOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: WalletOrmEntity): Wallet {
    return Wallet.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      ownerId: EntityId.from(e.ownerId),
      ownerType: e.ownerType as 'vendor' | 'driver',
      balance: Money.create(Number(e.balance), e.currency),
      pendingBalance: Money.create(Number(e.pendingBalance), e.currency),
      version: e.version,
    });
  }

  private toOrm(entity: Wallet): Partial<WalletOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      ownerId: entity.ownerId.value,
      ownerType: entity.ownerType,
      balance: entity.balance.amount,
      pendingBalance: entity.pendingBalance.amount,
      currency: entity.balance.currency,
      version: entity.version,
    };
  }
}
