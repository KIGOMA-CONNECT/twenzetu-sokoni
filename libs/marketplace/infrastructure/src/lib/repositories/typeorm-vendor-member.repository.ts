import { EntityId, TenantId } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  VendorMember,
  IVendorMemberRepository,
  VendorMemberStatus,
  VendorPermission,
  VendorStaffRole,
} from '@afri-market/marketplace-domain';
import { VendorMemberOrmEntity } from '../entities/vendor-member-orm.entity';

@Injectable()
export class TypeOrmVendorMemberRepository
  extends TypeOrmRepository<VendorMember, VendorMemberOrmEntity, EntityId>
  implements IVendorMemberRepository
{
  constructor(manager: EntityManager) {
    super(manager, VendorMemberOrmEntity);
  }

  public async findById(id: EntityId): Promise<VendorMember | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByVendorId(vendorId: string, status?: string): Promise<VendorMember[]> {
    const where = status ? { vendorId, status } : { vendorId };
    const entities = await this.repository.find({ where, order: { createdAt: 'ASC' }, take: 50 });
    return entities.map((e: VendorMemberOrmEntity) => this.toDomain(e));
  }

  public async findByUserId(userId: string): Promise<VendorMember[]> {
    const entities = await this.repository.find({ where: { userId } });
    return entities.map((e: VendorMemberOrmEntity) => this.toDomain(e));
  }

  public async findActiveByUserId(userId: string): Promise<VendorMember | null> {
    const entity = await this.repository.findOne({ where: { userId, status: 'ACTIVE' } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findOneByVendorAndUser(vendorId: string, userId: string): Promise<VendorMember | null> {
    const entity = await this.repository.findOne({ where: { vendorId, userId } });
    return entity ? this.toDomain(entity) : null;
  }

  public async save(entity: VendorMember): Promise<void> {
    const orm = this.toOrm(entity);
    const existing = await this.repository.findOne({ where: { id: entity.id.value } });
    if (existing) {
      await this.repository.save({ ...existing, ...orm });
    } else {
      await this.repository.save(orm as unknown as VendorMemberOrmEntity);
    }
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(e: VendorMemberOrmEntity): VendorMember {
    return VendorMember.reconstitute({
      id: EntityId.from(e.id),
      tenantId: TenantId.create(e.tenantId),
      vendorId: EntityId.from(e.vendorId),
      userId: EntityId.from(e.userId),
      role: e.role as VendorStaffRole,
      permissions: (e.permissions ?? []) as VendorPermission[],
      status: e.status as VendorMemberStatus,
      version: e.version,
    });
  }

  private toOrm(entity: VendorMember): Partial<VendorMemberOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      vendorId: entity.vendorId.value,
      userId: entity.userId.value,
      role: entity.role,
      permissions: entity.permissions,
      status: entity.status,
      version: entity.version,
    };
  }
}
