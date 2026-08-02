import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager, FindOptionsWhere, In, Not } from 'typeorm';
import {
  ServiceRequest,
  IServiceRequestRepository,
  ServiceRequestStatus,
} from '@afri-market/marketplace-domain';
import { ServiceRequestOrmEntity } from '../entities/service-request-orm.entity';

@Injectable()
export class TypeOrmServiceRequestRepository extends TypeOrmRepository<ServiceRequest, ServiceRequestOrmEntity, EntityId> implements IServiceRequestRepository {
  constructor(manager: EntityManager) {
    super(manager, ServiceRequestOrmEntity);
  }

  public async findById(id: EntityId): Promise<ServiceRequest | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByCustomerId(tenantId: string, customerId: string): Promise<ServiceRequest[]> {
    const entities = await this.repository.find({
      where: { tenantId, customerId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  public async findByVendorId(tenantId: string, vendorId: string, opts: { status?: string } = {}): Promise<ServiceRequest[]> {
    const where: FindOptionsWhere<ServiceRequestOrmEntity> = { tenantId, vendorId };
    if (opts.status) {
      where.status = opts.status;
    }
    const entities = await this.repository.find({ where, order: { createdAt: 'DESC' } });
    return entities.map((e) => this.toDomain(e));
  }

  public async countOpenByTenant(tenantId: string): Promise<number> {
    return this.repository.count({
      where: { tenantId, status: Not(In(['ORDERED', 'CANCELLED'])) },
    });
  }

  public async save(entity: ServiceRequest): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as ServiceRequestOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: ServiceRequestOrmEntity): ServiceRequest {
    return ServiceRequest.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      customerId: EntityId.from(e.customerId),
      vendorId: EntityId.from(e.vendorId),
      listingId: e.listingId ? EntityId.from(e.listingId) : undefined,
      title: e.title,
      quantity: Number(e.quantity),
      unitLabel: e.unitLabel,
      details: e.details,
      photoUrls: e.photoUrls ?? [],
      status: e.status as ServiceRequestStatus,
      agreedPrice: e.agreedPrice ? Money.create(Number(e.agreedPrice), e.currency) : undefined,
      currency: e.currency,
      orderId: e.orderId ? EntityId.from(e.orderId) : undefined,
      version: e.version,
    });
  }

  private toOrm(entity: ServiceRequest): Partial<ServiceRequestOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      customerId: entity.customerId.value,
      vendorId: entity.vendorId.value,
      listingId: entity.listingId?.value ?? null,
      title: entity.title,
      quantity: String(entity.quantity),
      unitLabel: entity.unitLabel,
      details: entity.details,
      photoUrls: entity.photoUrls,
      status: entity.status,
      agreedPrice: entity.agreedPrice ? String(entity.agreedPrice.amount) : null,
      currency: entity.currency,
      orderId: entity.orderId?.value ?? null,
      version: 1,
    };
  }
}
