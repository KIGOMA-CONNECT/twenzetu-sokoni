import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Delivery, IDeliveryRepository, VehicleType, DeliveryStatus } from '@afri-market/marketplace-domain';
import { DeliveryOrmEntity } from '../entities/delivery-orm.entity';

@Injectable()
export class TypeOrmDeliveryRepository extends TypeOrmRepository<Delivery, DeliveryOrmEntity, EntityId> implements IDeliveryRepository {
  constructor(manager: EntityManager) {
    super(manager, DeliveryOrmEntity);
  }

  public async findById(id: EntityId): Promise<Delivery | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByOrderId(orderId: string): Promise<Delivery | null> {
    const entity = await this.repository.findOne({ where: { orderId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByDriverId(driverId: string): Promise<Delivery[]> {
    const entities = await this.repository.find({ where: { driverId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findByIdAndTenant(id: string, tenantId: string): Promise<Delivery | null> {
    const entity = await this.repository.findOne({ where: { id, tenantId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByTenantAndDriver(
    tenantId: string,
    driverId: string,
    opts: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: Delivery[]; total: number }> {
    const qb = this.repository.createQueryBuilder('d')
      .where('d.tenant_id = :tenantId', { tenantId })
      .andWhere('d.driver_id = :driverId', { driverId });

    if (opts.status) {
      qb.andWhere('d.status = :status', { status: opts.status });
    }

    qb.orderBy('d.created_at', 'DESC')
      .take(opts.limit ?? 50)
      .skip(opts.offset ?? 0);

    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async save(entity: Delivery): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as DeliveryOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: DeliveryOrmEntity): Delivery {
    return Delivery.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      orderId: EntityId.from(e.orderId),
      driverId: EntityId.from(e.driverId),
      vehicleType: e.vehicleType as VehicleType,
      status: e.status as DeliveryStatus,
      pickupAddress: e.pickupAddress,
      deliveryAddress: e.deliveryAddress,
      pickupLatitude: e.pickupLatitude ?? undefined,
      pickupLongitude: e.pickupLongitude ?? undefined,
      deliveryLatitude: e.deliveryLatitude ?? undefined,
      deliveryLongitude: e.deliveryLongitude ?? undefined,
      distanceKm: e.distanceKm ?? undefined,
      estimatedTimeMinutes: e.estimatedTimeMinutes ?? undefined,
      driverEarnings: Money.create(Number(e.driverEarnings), e.currency),
      version: e.version,
    });
  }

  private toOrm(entity: Delivery): Partial<DeliveryOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      orderId: entity.orderId.value,
      driverId: entity.driverId.value,
      vehicleType: entity.vehicleType,
      status: entity.status,
      pickupAddress: entity.pickupAddress,
      deliveryAddress: entity.deliveryAddress,
      driverEarnings: entity.driverEarnings.amount,
      currency: entity.driverEarnings.currency,
      version: entity.version,
    };
  }
}
