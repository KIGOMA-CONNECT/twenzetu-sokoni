import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CustomerPoints, ICustomerPointsRepository, LoyaltyTier } from '@afri-market/marketplace-domain';
import { CustomerPointsOrmEntity } from '../entities/customer-points-orm.entity';

@Injectable()
export class TypeOrmCustomerPointsRepository extends TypeOrmRepository<CustomerPoints, CustomerPointsOrmEntity, EntityId> implements ICustomerPointsRepository {
  constructor(manager: EntityManager) {
    super(manager, CustomerPointsOrmEntity);
  }

  public async findById(id: EntityId): Promise<CustomerPoints | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByCustomerId(customerId: string): Promise<CustomerPoints | null> {
    const entity = await this.repository.findOne({ where: { customerId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByReferralCode(code: string): Promise<CustomerPoints | null> {
    const entity = await this.repository.findOne({ where: { referralCode: code } });
    return entity ? this.toDomain(entity) : null;
  }

  public async save(entity: CustomerPoints): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as CustomerPointsOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: CustomerPointsOrmEntity): CustomerPoints {
    return CustomerPoints.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      customerId: EntityId.from(e.customerId),
      totalPoints: e.totalPoints,
      redeemablePoints: e.redeemablePoints,
      lifetimePoints: e.lifetimePoints,
      tier: e.tier as LoyaltyTier,
      referralCode: e.referralCode ?? undefined,
      referredBy: e.referredBy ? EntityId.from(e.referredBy) : undefined,
      totalReferrals: e.totalReferrals,
      freeDeliveriesRemaining: e.freeDeliveriesRemaining,
      version: e.version,
    });
  }

  private toOrm(entity: CustomerPoints): Partial<CustomerPointsOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      customerId: entity.customerId.value,
      totalPoints: entity.totalPoints,
      redeemablePoints: entity.redeemablePoints,
      lifetimePoints: entity.lifetimePoints,
      tier: entity.tier,
      referralCode: entity.referralCode ?? null,
      freeDeliveriesRemaining: entity.freeDeliveriesRemaining,
      version: entity.version,
    };
  }
}
