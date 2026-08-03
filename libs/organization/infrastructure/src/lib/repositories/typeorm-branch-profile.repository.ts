import { TypeOrmRepository } from '@abms/database';
import { Address, ConcurrencyDomainException, CountryCode, CurrencyCode, EntityId, TenantId } from '@abms/kernel';
import { BranchProfile, IBranchProfileRepository } from '@abms/organization-domain';
import { EntityManager } from 'typeorm';
import { BranchProfileOrmEntity } from '../entities/branch-profile-orm.entity';

interface ExistsRow {
  exists: boolean;
}

export class TypeOrmBranchProfileRepository
  extends TypeOrmRepository<BranchProfile, BranchProfileOrmEntity, EntityId>
  implements IBranchProfileRepository
{
  public constructor(private readonly manager: EntityManager) {
    super(manager, BranchProfileOrmEntity);
  }

  public async findById(id: EntityId): Promise<BranchProfile | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByOrgUnitId(orgUnitId: EntityId): Promise<BranchProfile | null> {
    const row = await this.repository.findOne({ where: { orgUnitId: orgUnitId.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: BranchProfile): Promise<void> {
    const rows: ExistsRow[] = await this.manager.query(
      `SELECT EXISTS(SELECT 1 FROM "branch_profile" WHERE "id" = $1) AS "exists"`,
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

  private async insertNew(entity: BranchProfile): Promise<void> {
    await this.repository.insert({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      orgUnitId: entity.orgUnitId.toValue(),
      addressLine1: entity.address.line1,
      addressLine2: entity.address.line2,
      addressCity: entity.address.city,
      addressStateOrRegion: entity.address.stateOrRegion,
      addressPostalCode: entity.address.postalCode,
      addressCountryCode: entity.address.countryCode.value,
      operatingCurrency: entity.operatingCurrency.value,
      contactPhone: entity.contactPhone,
      contactEmail: entity.contactEmail,
      version: entity.version,
    });
  }

  private async updateExisting(entity: BranchProfile): Promise<void> {
    const result: [unknown[], number] = await this.manager.query(
      `UPDATE "branch_profile"
       SET "address_line1" = $1, "address_line2" = $2, "address_city" = $3,
           "address_state_or_region" = $4, "address_postal_code" = $5, "address_country_code" = $6,
           "operating_currency" = $7, "contact_phone" = $8, "contact_email" = $9,
           "version" = "version" + 1, "updated_at" = now()
       WHERE "id" = $10 AND "version" = $11`,
      [
        entity.address.line1,
        entity.address.line2,
        entity.address.city,
        entity.address.stateOrRegion,
        entity.address.postalCode,
        entity.address.countryCode.value,
        entity.operatingCurrency.value,
        entity.contactPhone,
        entity.contactEmail,
        entity.id.toValue(),
        entity.version,
      ],
    );

    if (result[1] === 0) {
      throw new ConcurrencyDomainException('BranchProfile', entity.id.toValue());
    }
  }

  private toDomain(row: BranchProfileOrmEntity): BranchProfile {
    return BranchProfile.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      orgUnitId: EntityId.create(row.orgUnitId),
      address: Address.create({
        line1: row.addressLine1,
        line2: row.addressLine2,
        city: row.addressCity,
        stateOrRegion: row.addressStateOrRegion,
        postalCode: row.addressPostalCode,
        countryCode: CountryCode.create(row.addressCountryCode).getValue(),
      }).getValue(),
      operatingCurrency: CurrencyCode.create(row.operatingCurrency).getValue(),
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      version: row.version,
    });
  }
}
