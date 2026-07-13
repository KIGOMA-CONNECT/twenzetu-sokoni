import { TypeOrmRepository } from '@abms/database';
import { ConcurrencyDomainException, CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { CostCenterProfile, ICostCenterProfileRepository } from '@abms/organization-domain';
import { EntityManager } from 'typeorm';
import { CostCenterProfileOrmEntity } from '../entities/cost-center-profile-orm.entity';

interface ExistsRow {
  exists: boolean;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class TypeOrmCostCenterProfileRepository
  extends TypeOrmRepository<CostCenterProfile, CostCenterProfileOrmEntity, EntityId>
  implements ICostCenterProfileRepository
{
  public constructor(private readonly manager: EntityManager) {
    super(manager, CostCenterProfileOrmEntity);
  }

  public async findById(id: EntityId): Promise<CostCenterProfile | null> {
    const row = await this.repository.findOne({ where: { id: id.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async findByOrgUnitId(orgUnitId: EntityId): Promise<CostCenterProfile | null> {
    const row = await this.repository.findOne({ where: { orgUnitId: orgUnitId.toValue() } });
    return row ? this.toDomain(row) : null;
  }

  public async exists(id: EntityId): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id.toValue() } });
    return count > 0;
  }

  public async save(entity: CostCenterProfile): Promise<void> {
    const rows: ExistsRow[] = await this.manager.query(
      `SELECT EXISTS(SELECT 1 FROM "cost_center_profile" WHERE "id" = $1) AS "exists"`,
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

  private async insertNew(entity: CostCenterProfile): Promise<void> {
    await this.repository.insert({
      id: entity.id.toValue(),
      tenantId: entity.tenantId.value,
      orgUnitId: entity.orgUnitId.toValue(),
      budgetAmount: entity.budget.amount,
      budgetCurrency: entity.budget.currency.value,
      budgetPeriodStart: toDateOnly(entity.budgetPeriodStart),
      budgetPeriodEnd: toDateOnly(entity.budgetPeriodEnd),
      glAccountCode: entity.glAccountCode,
      version: entity.version,
    });
  }

  private async updateExisting(entity: CostCenterProfile): Promise<void> {
    const result: [unknown[], number] = await this.manager.query(
      `UPDATE "cost_center_profile"
       SET "budget_amount" = $1, "budget_currency" = $2, "budget_period_start" = $3,
           "budget_period_end" = $4, "gl_account_code" = $5,
           "version" = "version" + 1, "updated_at" = now()
       WHERE "id" = $6 AND "version" = $7`,
      [
        entity.budget.amount,
        entity.budget.currency.value,
        toDateOnly(entity.budgetPeriodStart),
        toDateOnly(entity.budgetPeriodEnd),
        entity.glAccountCode,
        entity.id.toValue(),
        entity.version,
      ],
    );

    if (result[1] === 0) {
      throw new ConcurrencyDomainException('CostCenterProfile', entity.id.toValue());
    }
  }

  private toDomain(row: CostCenterProfileOrmEntity): CostCenterProfile {
    return CostCenterProfile.reconstitute({
      id: EntityId.create(row.id),
      tenantId: TenantId.create(row.tenantId).getValue(),
      orgUnitId: EntityId.create(row.orgUnitId),
      budget: Money.create(row.budgetAmount, CurrencyCode.create(row.budgetCurrency).getValue()).getValue(),
      budgetPeriodStart: new Date(row.budgetPeriodStart),
      budgetPeriodEnd: new Date(row.budgetPeriodEnd),
      glAccountCode: row.glAccountCode,
      version: row.version,
    });
  }
}
