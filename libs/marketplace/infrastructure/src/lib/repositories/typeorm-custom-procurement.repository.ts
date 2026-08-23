import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CustomProcurement, ICustomProcurementRepository, ProcurementStatus } from '@afri-market/marketplace-domain';
import { CustomProcurementOrmEntity } from '../entities/custom-procurement-orm.entity';

@Injectable()
export class TypeOrmCustomProcurementRepository extends TypeOrmRepository<CustomProcurement, CustomProcurementOrmEntity, EntityId> implements ICustomProcurementRepository {
  constructor(manager: EntityManager) {
    super(manager, CustomProcurementOrmEntity);
  }

  public async findById(id: EntityId): Promise<CustomProcurement | null> {
    const e = await this.repository.findOne({ where: { id: id.value } });
    return e ? this.toDomain(e) : null;
  }

  public async findByCustomerId(customerId: string): Promise<CustomProcurement[]> {
    const entities = await this.repository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return entities.map(e => this.toDomain(e));
  }

  public async save(entity: CustomProcurement): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as CustomProcurementOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    return (await this.repository.count({ where: { id: id.value } })) > 0;
  }

  private toDomain(e: CustomProcurementOrmEntity): CustomProcurement {
    return CustomProcurement.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      customerId: EntityId.from(e.customerId),
      productQuery: e.productQuery,
      specifications: e.specifications ?? undefined,
      status: e.status as ProcurementStatus,
      version: e.version,
    });
  }

  private toOrm(entity: CustomProcurement): Partial<CustomProcurementOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      customerId: entity.customerId.value,
      productQuery: entity.productQuery,
      specifications: entity.specifications ?? null,
      status: entity.status,
      version: 1,
    };
  }
}
