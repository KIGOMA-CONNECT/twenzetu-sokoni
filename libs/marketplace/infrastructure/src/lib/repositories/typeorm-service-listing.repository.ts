import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager, FindOptionsWhere, Like } from 'typeorm';
import {
  ServiceListing,
  IServiceListingRepository,
  ServicePricingModel,
} from '@afri-market/marketplace-domain';
import { ServiceListingOrmEntity } from '../entities/service-listing-orm.entity';

@Injectable()
export class TypeOrmServiceListingRepository extends TypeOrmRepository<ServiceListing, ServiceListingOrmEntity, EntityId> implements IServiceListingRepository {
  constructor(manager: EntityManager) {
    super(manager, ServiceListingOrmEntity);
  }

  public async findById(id: EntityId): Promise<ServiceListing | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByVendorId(tenantId: string, vendorId: string): Promise<ServiceListing[]> {
    const entities = await this.repository.find({ where: { tenantId, vendorId } });
    return entities.map((e) => this.toDomain(e));
  }

  public async findActive(
    tenantId: string,
    opts: { category?: string; search?: string; limit?: number; offset?: number } = {},
  ): Promise<{ data: ServiceListing[]; total: number }> {
    const where: FindOptionsWhere<ServiceListingOrmEntity> = { tenantId, isActive: true };
    if (opts.category) {
      where.category = opts.category;
    }
    if (opts.search) {
      where.name = Like(`%${opts.search}%`);
    }
    const [entities, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
    });
    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  public async save(entity: ServiceListing): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as ServiceListingOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: ServiceListingOrmEntity): ServiceListing {
    return ServiceListing.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      vendorId: EntityId.from(e.vendorId),
      name: e.name,
      description: e.description,
      category: e.category,
      pricingModel: e.pricingModel as ServicePricingModel,
      basePrice: Money.create(Number(e.basePrice), e.currency),
      unitLabel: e.unitLabel,
      imageUrl: e.imageUrl ?? undefined,
      isActive: e.isActive,
      version: e.version,
    });
  }

  private toOrm(entity: ServiceListing): Partial<ServiceListingOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      vendorId: entity.vendorId.value,
      name: entity.name,
      description: entity.description,
      category: entity.category,
      pricingModel: entity.pricingModel,
      basePrice: String(entity.basePrice.amount),
      currency: entity.basePrice.currency,
      unitLabel: entity.unitLabel,
      imageUrl: entity.imageUrl ?? null,
      isActive: entity.isActive,
      version: 1,
    };
  }
}
