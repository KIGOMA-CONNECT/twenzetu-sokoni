import { TypeOrmRepository } from '@abms/database';
import { ConcurrencyDomainException, Email, EntityId, TenantId } from '@abms/kernel';
import { IUserRepository, User, UserRole } from '@abms/identity-domain';
import { EntityManager } from 'typeorm';
import { UserOrmEntity } from '../entities/user-orm.entity';

interface ExistsRow {
  exists: boolean;
}

export class TypeOrmUserRepository
  extends TypeOrmRepository<User, UserOrmEntity, EntityId>
  implements IUserRepository
{
  public constructor(private readonly manager: EntityManager) {
    super(manager, UserOrmEntity);
  }

  public async findById(id: EntityId): Promise<User | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const row = await this.repository.findOne({ where: { email: email.value } });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: User): Promise<void> {
    const rows: ExistsRow[] = await this.manager.query(
      `SELECT EXISTS(SELECT 1 FROM "user" WHERE "id" = $1) AS "exists"`,
      [entity.id.toValue()],
    );

    if (!rows[0]?.exists) {
      await this.insertNew(entity);
      return;
    }
    await this.updateExisting(entity);
  }

  public async delete(id: EntityId): Promise<void> {
    await this.repository.delete({ id: id.toValue() });
  }

  private async insertNew(entity: User): Promise<void> {
    await this.repository.insert({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      email: entity.email.value,
      passwordHash: entity.passwordHash,
      role: entity.role,
      isActive: entity.isActive,
      version: entity.version,
    });
  }

  private async updateExisting(entity: User): Promise<void> {
    const result: [unknown[], number] = await this.manager.query(
      `UPDATE "user"
       SET "password_hash" = $1, "role" = $2, "is_active" = $3,
           "version" = "version" + 1, "updated_at" = now()
       WHERE "id" = $4 AND "version" = $5`,
      [entity.passwordHash, entity.role, entity.isActive, entity.id.toValue(), entity.version],
    );

    if (result[1] === 0) {
      throw new ConcurrencyDomainException('User', entity.id.toValue());
    }
  }

  private toDomain(row: UserOrmEntity): User {
    return User.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      email: Email.create(row.email).getValue(),
      passwordHash: row.passwordHash,
      role: row.role as UserRole,
      isActive: row.isActive,
      version: row.version,
    });
  }
}
