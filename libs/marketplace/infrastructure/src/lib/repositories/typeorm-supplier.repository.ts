import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Supplier, ISupplierRepository, SupplierStatus } from '@afri-market/marketplace-domain';
import { SupplierOrmEntity } from '../entities/supplier-orm.entity';

@Injectable()
export class TypeOrmSupplierRepository
  extends TypeOrmRepository<Supplier, SupplierOrmEntity, EntityId>
  implements ISupplierRepository
{
  constructor(manager: EntityManager) {
    super(manager, SupplierOrmEntity);
  }

  public async findById(id: EntityId): Promise<Supplier | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByVendorId(vendorId: string): Promise<Supplier[]> {
    const entities = await this.repository.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  public async save(supplier: Supplier): Promise<void> {
    const orm = this.toOrm(supplier);
    const existing = await this.repository.findOne({ where: { id: supplier.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as SupplierOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: SupplierOrmEntity): Supplier {
    return Supplier.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      vendorId: EntityId.from(e.vendorId),
      name: e.name,
      phone: e.phone ?? undefined,
      contactPerson: e.contactPerson ?? undefined,
      notes: e.notes ?? undefined,
      linkedVendorId: e.linkedVendorId ?? undefined,
      status: e.status as SupplierStatus,
      version: e.version,
    }, e.createdAt);
  }

  private toOrm(entity: Supplier): Partial<SupplierOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      vendorId: entity.vendorId.value,
      name: entity.name,
      phone: entity.phone ?? null,
      contactPerson: entity.contactPerson ?? null,
      notes: entity.notes ?? null,
      linkedVendorId: entity.linkedVendorId ?? null,
      status: entity.status,
      version: entity.version,
    };
  }
}