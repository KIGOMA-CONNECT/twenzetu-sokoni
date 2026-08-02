import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  ServiceQuote,
  IServiceQuoteRepository,
  ServiceQuoteStatus,
} from '@afri-market/marketplace-domain';
import { ServiceQuoteOrmEntity } from '../entities/service-quote-orm.entity';

@Injectable()
export class TypeOrmServiceQuoteRepository extends TypeOrmRepository<ServiceQuote, ServiceQuoteOrmEntity, EntityId> implements IServiceQuoteRepository {
  constructor(manager: EntityManager) {
    super(manager, ServiceQuoteOrmEntity);
  }

  public async findById(id: EntityId): Promise<ServiceQuote | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByRequestId(requestId: string): Promise<ServiceQuote[]> {
    const entities = await this.repository.find({
      where: { requestId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  public async save(entity: ServiceQuote): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as ServiceQuoteOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: ServiceQuoteOrmEntity): ServiceQuote {
    return ServiceQuote.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      requestId: EntityId.from(e.requestId),
      vendorId: EntityId.from(e.vendorId),
      price: Money.create(Number(e.price), e.currency),
      message: e.message,
      status: e.status as ServiceQuoteStatus,
      version: e.version,
    });
  }

  private toOrm(entity: ServiceQuote): Partial<ServiceQuoteOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      requestId: entity.requestId.value,
      vendorId: entity.vendorId.value,
      price: String(entity.price.amount),
      currency: entity.price.currency,
      message: entity.message,
      status: entity.status,
      version: 1,
    };
  }
}
