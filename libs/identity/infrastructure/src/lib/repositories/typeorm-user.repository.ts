import { EntityId, TenantId, PhoneNumber, Email } from '@afri-market/kernel';
import { TypeOrmRepository } from '@afri-market/database';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User, IUserRepository, UserRole, UserStatus, AdminPermission } from '@afri-market/identity-domain';
import { UserOrmEntity } from '../entities/user-orm.entity';

@Injectable()
export class TypeOrmUserRepository extends TypeOrmRepository<User, UserOrmEntity, EntityId> implements IUserRepository {
  constructor(manager: EntityManager) {
    super(manager, UserOrmEntity);
  }

  public async findById(id: EntityId): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { phoneNumber } });
    return entity ? this.toDomain(entity) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  public async countByTenant(tenantId: string): Promise<number> {
    return this.repository.count({ where: { tenantId } });
  }

  public async save(entity: User): Promise<void> {
    await this.repository.save(this.toOrm(entity));
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete(id.value);
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.value } });
    return count > 0;
  }

  private toDomain(entity: UserOrmEntity): User {
    return User.reconstitute({
      id: EntityId.from(entity.id),
      tenantId: TenantId.create(entity.tenantId),
      phoneNumber: PhoneNumber.create(entity.phoneNumber),
      fullName: entity.fullName,
      role: entity.role as UserRole,
      passwordHash: entity.passwordHash,
      email: entity.email ? Email.create(entity.email) : undefined,
      status: entity.status as UserStatus,
      version: entity.version,
      permissions: entity.permissions ? entity.permissions.split(',').filter(Boolean) as AdminPermission[] : [],
    });
  }

  private toOrm(entity: User): Partial<UserOrmEntity> {
    return {
      id: entity.id.value,
      tenantId: entity.tenantId.value,
      phoneNumber: entity.phoneNumber.value,
      fullName: entity.fullName,
      role: entity.role,
      passwordHash: entity.passwordHash,
      email: entity.email?.value ?? null,
      status: entity.status,
      version: entity.version,
      permissions: entity.permissions.length > 0 ? entity.permissions.join(',') : null,
    };
  }
}
