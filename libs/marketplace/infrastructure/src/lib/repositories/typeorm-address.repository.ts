import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Address, IAddressRepository } from '@afri-market/marketplace-domain';
import { AddressOrmEntity } from '../entities/address-orm.entity';

@Injectable()
export class TypeOrmAddressRepository extends TypeOrmRepository<Address, AddressOrmEntity, EntityId> implements IAddressRepository {
  constructor(manager: EntityManager) {
    super(manager, AddressOrmEntity);
  }

  public async findById(id: EntityId): Promise<Address | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByUserId(userId: string): Promise<Address[]> {
    const entities = await this.repository.find({ where: { userId } });
    return entities.map((e: AddressOrmEntity) => this.toDomain(e));
  }

  public async findDefaultByUserId(userId: string): Promise<Address | null> {
    const entity = await this.repository.findOne({ where: { userId, isDefault: true } });
    return entity ? this.toDomain(entity) : null;
  }

  public async clearDefault(userId: string): Promise<void> {
    await this.repository.update({ userId, isDefault: true }, { isDefault: false });
  }

  public async save(entity: Address): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as AddressOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: AddressOrmEntity): Address {
    return Address.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      userId: EntityId.from(e.userId),
      label: e.label,
      fullAddress: e.fullAddress,
      latitude: Number(e.latitude),
      longitude: Number(e.longitude),
      isDefault: e.isDefault,
    });
  }

  private toOrm(entity: Address): Partial<AddressOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      userId: entity.userId.value,
      label: entity.label,
      fullAddress: entity.fullAddress,
      latitude: entity.latitude,
      longitude: entity.longitude,
      isDefault: entity.isDefault,
    };
  }
}
