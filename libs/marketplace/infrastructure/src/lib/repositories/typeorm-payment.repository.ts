import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Payment, IPaymentRepository, PaymentSearchFilters, PaymentRevenueFilters, PaymentMethod, PaymentStatus } from '@afri-market/marketplace-domain';
import { PaymentOrmEntity } from '../entities/payment-orm.entity';

@Injectable()
export class TypeOrmPaymentRepository extends TypeOrmRepository<Payment, PaymentOrmEntity, EntityId> implements IPaymentRepository {
  constructor(manager: EntityManager) {
    super(manager, PaymentOrmEntity);
  }

  public async findById(id: EntityId): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByOrderId(orderId: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { orderId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByTransactionRef(transactionRef: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { transactionRef } });
    return entity ? this.toDomain(entity) : null;
  }

  public async save(entity: Payment): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as PaymentOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async search(tenantId: string, filters: PaymentSearchFilters): Promise<{ data: Payment[]; total: number }> {
    const qb = this.repository.createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId });
    if (filters.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (filters.vendorId) {
      qb.andWhere('p.vendor_id = :vendorId', { vendorId: filters.vendorId });
    }
    qb.orderBy('p.created_at', 'DESC')
      .take(filters.limit ?? 50)
      .skip(filters.offset ?? 0);
    const [entities, total] = await qb.getManyAndCount();
    return { data: entities.map(e => this.toDomain(e)), total };
  }

  public async sumRevenue(tenantId: string, filters?: PaymentRevenueFilters): Promise<{ total: number; count: number }> {
    const qb = this.repository.createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId });
    if (filters?.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (filters?.since) {
      qb.andWhere('p.created_at >= :since', { since: filters.since });
    }
    const result = await qb
      .select('SUM(p.amount)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .getRawOne();
    return {
      total: Number(result?.total ?? 0),
      count: Number(result?.count ?? 0),
    };
  }

  public async sumVendorNet(tenantId: string, filters?: PaymentRevenueFilters): Promise<number> {
    const qb = this.repository.createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId });
    if (filters?.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }
    if (filters?.since) {
      qb.andWhere('p.created_at >= :since', { since: filters.since });
    }
    const result = await qb
      .select('SUM(p.vendor_net)', 'total')
      .getRawOne();
    return Number(result?.total ?? 0);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: PaymentOrmEntity): Payment {
    return Payment.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      orderId: EntityId.from(e.orderId),
      customerId: EntityId.from(e.customerId),
      vendorId: EntityId.from(e.vendorId),
      amount: Money.create(Number(e.amount), e.currency),
      method: e.method as PaymentMethod,
      status: e.status as PaymentStatus,
      systemCommission: Money.create(Number(e.systemCommission), e.currency),
      vendorNet: Money.create(Number(e.vendorNet), e.currency),
      driverNet: Money.create(Number(e.driverNet), e.currency),
      transactionRef: e.transactionRef ?? undefined,
      version: e.version,
    });
  }

  private toOrm(entity: Payment): Partial<PaymentOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      orderId: entity.orderId.value,
      amount: entity.amount.amount,
      currency: entity.amount.currency,
      method: entity.method,
      status: entity.status,
      systemCommission: entity.systemCommission.amount,
      vendorNet: entity.vendorNet.amount,
      driverNet: entity.driverNet.amount,
      transactionRef: entity.transactionRef ?? null,
      version: entity.version,
    };
  }
}
