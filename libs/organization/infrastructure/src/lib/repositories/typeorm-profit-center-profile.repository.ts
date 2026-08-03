import { TypeOrmRepository } from '@abms/database';
import { ConcurrencyDomainException, CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { IProfitCenterProfileRepository, ProfitCenterProfile } from '@abms/organization-domain';
import { EntityManager } from 'typeorm';
import { ProfitCenterProfileOrmEntity } from '../entities/profit-center-profile-orm.entity';

interface ExistsRow {
  exists: boolean;
}

export class TypeOrmProfitCenterProfileRepository
  extends TypeOrmRepository<ProfitCenterProfile, ProfitCenterProfileOrmEntity, EntityId>
  implements IProfitCenterProfileRepository
{
  public constructor(private readonly manager: EntityManager) {
    super(manager, ProfitCenterProfileOrmEntity);
  }

  public async findById(id: EntityId): Promise<ProfitCenterProfile | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByOrgUnitId(orgUnitId: EntityId): Promise<ProfitCenterProfile | null> {
    const row = await this.repository.findOne({ where: { orgUnitId: orgUnitId.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: ProfitCenterProfile): Promise<void> {
    const rows: ExistsRow[] = await this.manager.query(
      `SELECT EXISTS(SELECT 1 FROM "profit_center_profile" WHERE "id" = $1) AS "exists"`,
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

  private async insertNew(entity: ProfitCenterProfile): Promise<void> {
    await this.repository.insert({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      orgUnitId: entity.orgUnitId.toValue(),
      revenueTargetAmount: entity.revenueTarget.amount,
      revenueTargetCurrency: entity.revenueTarget.currency.value,
      reportingCurrency: entity.reportingCurrency.value,
      glAccountCode: entity.glAccountCode,
      version: entity.version,
    });
  }

  private async updateExisting(entity: ProfitCenterProfile): Promise<void> {
    const result: [unknown[], number] = await this.manager.query(
      `UPDATE "profit_center_profile"
       SET "revenue_target_amount" = $1, "revenue_target_currency" = $2, "reporting_currency" = $3,
           "gl_account_code" = $4,
           "version" = "version" + 1, "updated_at" = now()
       WHERE "id" = $5 AND "version" = $6`,
      [
        entity.revenueTarget.amount,
        entity.revenueTarget.currency.value,
        entity.reportingCurrency.value,
        entity.glAccountCode,
        entity.id.toValue(),
        entity.version,
      ],
    );

    if (result[1] === 0) {
      throw new ConcurrencyDomainException('ProfitCenterProfile', entity.id.toValue());
    }
  }

  private toDomain(row: ProfitCenterProfileOrmEntity): ProfitCenterProfile {
    return ProfitCenterProfile.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      orgUnitId: EntityId.create(row.orgUnitId),
      revenueTarget: Money.create(
        row.revenueTargetAmount,
        CurrencyCode.create(row.revenueTargetCurrency).getValue(),
      ).getValue(),
      reportingCurrency: CurrencyCode.create(row.reportingCurrency).getValue(),
      glAccountCode: row.glAccountCode,
      version: row.version,
    });
  }
}
