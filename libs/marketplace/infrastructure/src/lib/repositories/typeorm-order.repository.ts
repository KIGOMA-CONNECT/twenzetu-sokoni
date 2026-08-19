import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Order, IOrderRepository, OrderCountFilters, OrderType, OrderStatus } from '@afri-market/marketplace-domain';
import { OrderOrmEntity } from '../entities/order-orm.entity';

@Injectable()
export class TypeOrmOrderRepository extends TypeOrmRepository<Order, OrderOrmEntity, EntityId> implements IOrderRepository {
  constructor(manager: EntityManager) {
    super(manager, OrderOrmEntity);
  }

  public async findById(id: EntityId): Promise<Order | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByCustomerId(customerId: string): Promise<Order[]> {
    const entities = await this.repository.find({ where: { customerId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findByVendorId(vendorId: string): Promise<Order[]> {
    const entities = await this.repository.find({ where: { vendorId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findByDriverId(driverId: string): Promise<Order[]> {
    const entities = await this.repository.find({ where: { driverId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findPendingByVendor(vendorId: string): Promise<Order[]> {
    const entities = await this.repository.find({ where: { vendorId, status: 'PLACED' } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findByIdAndTenant(id: string, tenantId: string): Promise<Order | null> {
    const entity = await this.repository.findOne({ where: { id, tenantId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByTenantAndVendor(
    tenantId: string,
    vendorId: string,
    opts: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: Order[]; total: number }> {
    const qb = this.repository.createQueryBuilder('o')
      .where('o.tenant_id = :tenantId', { tenantId })
      .andWhere('o.vendor_id = :vendorId', { vendorId });

    if (opts.status) {
      qb.andWhere('o.status = :status', { status: opts.status });
    }

    qb.orderBy('o.created_at', 'DESC')
      .take(opts.limit ?? 50)
      .skip(opts.offset ?? 0);

    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async countByTenant(tenantId: string, filters?: OrderCountFilters): Promise<number> {
    const qb = this.repository.createQueryBuilder('o')
      .where('o.tenant_id = :tenantId', { tenantId });
    if (filters?.excludeStatuses?.length) {
      qb.andWhere('o.status NOT IN (:...statuses)', { statuses: filters.excludeStatuses });
    }
    if (filters?.since) {
      qb.andWhere('o.created_at >= :since', { since: filters.since });
    }
    return qb.getCount();
  }

  public async findRecentByTenant(tenantId: string, limit = 20): Promise<Order[]> {
    const entities = await this.repository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map(e => this.toDomain(e));
  }

  public async save(entity: Order): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as OrderOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: OrderOrmEntity): Order {
    return Order.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      customerId: EntityId.from(e.customerId),
      vendorId: EntityId.from(e.vendorId),
      driverId: e.driverId ? EntityId.from(e.driverId) : undefined,
      type: e.type as OrderType,
      status: e.status as OrderStatus,
      subtotal: Money.create(Number(e.subtotal), e.currency),
      deliveryFee: Money.create(Number(e.deliveryFee), e.currency),
      systemCommission: Money.create(Number(e.systemCommission), e.currency),
      totalAmount: Money.create(Number(e.totalAmount), e.currency),
      deliveryAddress: e.deliveryAddress,
      deliveryLatitude: e.deliveryLatitude ?? undefined,
      deliveryLongitude: e.deliveryLongitude ?? undefined,
      specialInstructions: e.specialInstructions ?? undefined,
      OTPCode: e.otpCode ?? undefined,
      OTPVerified: e.otpVerified,
      OTPAttempts: e.otpAttempts,
      PickupCode: e.pickupCode ?? undefined,
      version: e.version,
      createdAt: e.createdAt ?? new Date(),
    });
  }

  private toOrm(entity: Order): Partial<OrderOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      customerId: entity.customerId.value,
      vendorId: entity.vendorId.value,
      driverId: entity.driverId?.value ?? null,
      type: entity.type,
      status: entity.status,
      subtotal: entity.subtotal.amount,
      deliveryFee: entity.deliveryFee.amount,
      systemCommission: entity.systemCommission.amount,
      totalAmount: entity.totalAmount.amount,
      currency: entity.totalAmount.currency,
      deliveryAddress: entity.deliveryAddress,
      deliveryLatitude: entity.deliveryLatitude ?? null,
      deliveryLongitude: entity.deliveryLongitude ?? null,
      specialInstructions: entity.specialInstructions ?? null,
      otpCode: entity.otpCode ?? null,
      otpVerified: entity.otpVerified,
      otpAttempts: entity.otpAttempts,
      pickupCode: entity.pickupCode ?? null,
      version: entity.version,
    };
  }
}
