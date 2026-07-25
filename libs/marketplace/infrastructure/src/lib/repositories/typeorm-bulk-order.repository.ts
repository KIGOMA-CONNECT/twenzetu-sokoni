import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BulkOrder, IBulkOrderRepository, BulkOrderStatus } from '@afri-market/marketplace-domain';
import { BulkOrderOrmEntity } from '../entities/bulk-order-orm.entity';

@Injectable()
export class TypeOrmBulkOrderRepository extends TypeOrmRepository<BulkOrder, BulkOrderOrmEntity, EntityId> implements IBulkOrderRepository {
  constructor(manager: EntityManager) {
    super(manager, BulkOrderOrmEntity);
  }

  public async findById(id: EntityId): Promise<BulkOrder | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findActiveByTenant(tenantId: string): Promise<BulkOrder[]> {
    const entities = await this.repository.createQueryBuilder('bo')
      .where('bo.tenant_id = :tenantId', { tenantId })
      .andWhere('bo.status IN (:...statuses)', { statuses: ['COLLECTING', 'CONSOLIDATED', 'PLACED_WITH_SUPPLIER', 'IN_TRANSIT'] })
      .getMany();
    return entities.map(e => this.toDomain(e));
  }

  public async findByVendor(vendorId: string): Promise<BulkOrder[]> {
    const entities = await this.repository.createQueryBuilder('bo')
      .where('bo.participant_vendor_ids @> :vendorId', { vendorId: JSON.stringify([vendorId]) })
      .getMany();
    return entities.map(e => this.toDomain(e));
  }

  public async save(entity: BulkOrder): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as BulkOrderOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: BulkOrderOrmEntity): BulkOrder {
    return BulkOrder.reconstitute(EntityId.from(e.id), {
      tenantId: TenantId.create(e.tenantId),
      sourceType: e.sourceType,
      sourceName: e.sourceName,
      sourcePhone: e.sourcePhone,
      productName: e.productName,
      totalQuantity: e.totalQuantity,
      unit: e.unit,
      totalAmount: Money.create(Number(e.totalAmount), e.currency),
      participantVendorIds: e.participantVendorIds ?? [],
      status: e.status as BulkOrderStatus,
      expectedDeliveryDate: e.expectedDeliveryDate ?? undefined,
      deliveredAt: e.deliveredAt ?? undefined,
      version: e.version,
    });
  }

  private toOrm(entity: BulkOrder): Partial<BulkOrderOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      sourceType: entity.sourceType,
      sourceName: entity.sourceName,
      sourcePhone: '0000000000',
      productName: entity.productName,
      totalQuantity: entity.totalQuantity,
      unit: 'pcs',
      totalAmount: entity.totalAmount.amount,
      currency: entity.totalAmount.currency,
      participantVendorIds: entity.participantVendorIds,
      status: entity.status,
      version: entity.version,
    };
  }
}
