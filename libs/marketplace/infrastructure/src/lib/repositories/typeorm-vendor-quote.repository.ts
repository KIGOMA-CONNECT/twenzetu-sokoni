import { EntityId, Money } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VendorQuote, IVendorQuoteRepository, ItemCondition } from '@afri-market/marketplace-domain';
import { VendorQuoteOrmEntity } from '../entities/vendor-quote-orm.entity';

@Injectable()
export class TypeOrmVendorQuoteRepository extends TypeOrmRepository<VendorQuote, VendorQuoteOrmEntity, EntityId> implements IVendorQuoteRepository {
  constructor(manager: EntityManager) {
    super(manager, VendorQuoteOrmEntity);
  }

  public async findById(id: EntityId): Promise<VendorQuote | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByProcurementId(procurementId: string): Promise<VendorQuote[]> {
    const entities = await this.repository.find({ where: { procurementId } });
    return entities.map(e => this.toDomain(e));
  }

  public async save(entity: VendorQuote): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as VendorQuoteOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: VendorQuoteOrmEntity): VendorQuote {
    return VendorQuote.reconstitute({
      id: EntityId.from(e.id),
      procurementId: EntityId.from(e.procurementId),
      vendorId: EntityId.from(e.vendorId),
      price: Money.create(Number(e.price), e.currency),
      itemCondition: e.itemCondition as ItemCondition,
      warrantyPeriodDays: e.warrantyPeriodDays,
      version: e.version,
    });
  }

  private toOrm(entity: VendorQuote): Partial<VendorQuoteOrmEntity> {
    return {
      id: entity.id.value,
      procurementId: entity.procurementId.value,
      vendorId: entity.vendorId.value,
      price: entity.price.amount,
      currency: entity.price.currency,
      itemCondition: entity.itemCondition,
      warrantyPeriodDays: entity.warrantyPeriodDays,
      version: 1,
    };
  }
}
