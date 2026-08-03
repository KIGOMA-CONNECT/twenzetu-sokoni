import { TypeOrmRepository } from '@abms/database';
import { ConcurrencyDomainException, CountryCode, CurrencyCode, EntityId, TaxIdentifier, TenantId } from '@abms/kernel';
import { CompanyProfile, ICompanyProfileRepository } from '@abms/organization-domain';
import { EntityManager } from 'typeorm';
import { CompanyProfileOrmEntity } from '../entities/company-profile-orm.entity';

interface ExistsRow {
  exists: boolean;
}

export class TypeOrmCompanyProfileRepository
  extends TypeOrmRepository<CompanyProfile, CompanyProfileOrmEntity, EntityId>
  implements ICompanyProfileRepository
{
  public constructor(private readonly manager: EntityManager) {
    super(manager, CompanyProfileOrmEntity);
  }

  public async findById(id: EntityId): Promise<CompanyProfile | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByOrgUnitId(orgUnitId: EntityId): Promise<CompanyProfile | null> {
    const row = await this.repository.findOne({ where: { orgUnitId: orgUnitId.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: CompanyProfile): Promise<void> {
    const rows: ExistsRow[] = await this.manager.query(
      `SELECT EXISTS(SELECT 1 FROM "company_profile" WHERE "id" = $1) AS "exists"`,
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

  private async insertNew(entity: CompanyProfile): Promise<void> {
    await this.repository.insert({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      orgUnitId: entity.orgUnitId.toValue(),
      legalName: entity.legalName,
      registrationNumber: entity.registrationNumber,
      taxCountryCode: entity.taxIdentifier.countryCode.value,
      taxNumber: entity.taxIdentifier.taxNumber,
      functionalCurrency: entity.functionalCurrency.value,
      fiscalYearStartMonth: entity.fiscalYearStartMonth,
      version: entity.version,
    });
  }

  private async updateExisting(entity: CompanyProfile): Promise<void> {
    const result: [unknown[], number] = await this.manager.query(
      `UPDATE "company_profile"
       SET "legal_name" = $1, "registration_number" = $2, "tax_country_code" = $3, "tax_number" = $4,
           "functional_currency" = $5, "fiscal_year_start_month" = $6,
           "version" = "version" + 1, "updated_at" = now()
       WHERE "id" = $7 AND "version" = $8`,
      [
        entity.legalName,
        entity.registrationNumber,
        entity.taxIdentifier.countryCode.value,
        entity.taxIdentifier.taxNumber,
        entity.functionalCurrency.value,
        entity.fiscalYearStartMonth,
        entity.id.toValue(),
        entity.version,
      ],
    );

    if (result[1] === 0) {
      throw new ConcurrencyDomainException('CompanyProfile', entity.id.toValue());
    }
  }

  private toDomain(row: CompanyProfileOrmEntity): CompanyProfile {
    return CompanyProfile.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      orgUnitId: EntityId.create(row.orgUnitId),
      legalName: row.legalName,
      registrationNumber: row.registrationNumber,
      taxIdentifier: TaxIdentifier.create(
        CountryCode.create(row.taxCountryCode).getValue(),
        row.taxNumber,
      ).getValue(),
      functionalCurrency: CurrencyCode.create(row.functionalCurrency).getValue(),
      fiscalYearStartMonth: row.fiscalYearStartMonth,
      version: row.version,
    });
  }
}
