import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  Address,
  BusinessRuleViolationException,
  ConcurrencyDomainException,
  CountryCode,
  CurrencyCode,
  EntityId,
  Money,
  TaxIdentifier,
  TenantId,
} from '@abms/kernel';
import {
  BranchProfile,
  CompanyProfile,
  CostCenterProfile,
  DepartmentProfile,
  OrgUnit,
  OrgUnitType,
  ProfitCenterProfile,
} from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { DataSource } from 'typeorm';
import { ORGANIZATION_ENTITIES } from '../organization-entities';
import { assertOrgUnitType } from '../handlers/profiles/assert-org-unit-type';
import { TypeOrmBranchProfileRepository } from './typeorm-branch-profile.repository';
import { TypeOrmCompanyProfileRepository } from './typeorm-company-profile.repository';
import { TypeOrmCostCenterProfileRepository } from './typeorm-cost-center-profile.repository';
import { TypeOrmDepartmentProfileRepository } from './typeorm-department-profile.repository';
import { TypeOrmOrgUnitTypeRepository } from './typeorm-org-unit-type.repository';
import { TypeOrmOrgUnitRepository } from './typeorm-org-unit.repository';
import { TypeOrmProfitCenterProfileRepository } from './typeorm-profit-center-profile.repository';

const TEST_TENANT_ID = '66666666-6666-4666-8666-666666666666';
const OTHER_TENANT_ID = '77777777-7777-4777-8777-777777777777';

describe('Organization profile tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();
  const orgUnitTypeIdByCode = new Map<string, EntityId>();
  const orgUnitByCode = new Map<string, OrgUnit>();

  beforeAll(async () => {
    const config = new AppConfigService(process.env);

    ownerDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.ownerUser,
      password: config.database.ownerPassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
    });
    await ownerDataSource.initialize();

    runtimeDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.runtimeUser,
      password: config.database.runtimePassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
      entities: ORGANIZATION_ENTITIES,
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);

    const typeCodes = ['COMPANY', 'BRANCH', 'DEPARTMENT', 'COST_CENTER', 'PROFIT_CENTER'];
    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const typeRepository = new TypeOrmOrgUnitTypeRepository(ctx.manager);
        const orgUnitRepository = new TypeOrmOrgUnitRepository(ctx.manager);

        for (const code of typeCodes) {
          const type = OrgUnitType.create({ tenantId, code, name: code });
          await typeRepository.save(type);
          orgUnitTypeIdByCode.set(code, type.id);

          const orgUnit = OrgUnit.create({
            tenantId,
            orgUnitTypeId: type.id,
            parentId: null,
            code: `${code}_UNIT`,
            name: `${code} unit`,
          });
          await orgUnitRepository.save(orgUnit);
          orgUnitByCode.set(code, orgUnit);
        }
      }),
    );
  });

  afterAll(async () => {
    // FORCE ROW LEVEL SECURITY applies to the owner role too, not just the runtime role —
    // the tenant GUC must be set within the same transaction before these DELETEs, or RLS
    // silently filters them to zero rows affected (see rls-helper.ts's inline comment).
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      for (const table of [
        'company_profile',
        'branch_profile',
        'department_profile',
        'cost_center_profile',
        'profit_center_profile',
      ]) {
        await manager.query(`DELETE FROM "${table}" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      }
      await manager.query(`DELETE FROM "org_unit_closure" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "org_unit" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "org_unit_type_allowed_parent" WHERE "tenant_id" = $1`, [
        TEST_TENANT_ID,
      ]);
      await manager.query(`DELETE FROM "org_unit_type" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  // Sets the tenant GUC first so the INSERT passes RLS's WITH CHECK and the rejection
  // being asserted is actually the FK constraint, not RLS silently blocking the write.
  async function insertExpectingFkRejection(sql: string, params: unknown[]): Promise<void> {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(sql, params);
    });
  }

  describe('CompanyProfile', () => {
    const orgUnitId = () => orgUnitByCode.get('COMPANY')!.id;

    it('saves and finds by org unit id, is invisible under another tenant (RLS), rejects a duplicate for the same org unit, and rejects a stale CAS update', async () => {
      const profile = CompanyProfile.create({
        tenantId,
        orgUnitId: orgUnitId(),
        legalName: 'Afribiz Holdings Ltd',
        registrationNumber: 'REG-001',
        taxIdentifier: TaxIdentifier.create(CountryCode.create('TZ').getValue(), '123-456-789').getValue(),
        functionalCurrency: CurrencyCode.create('TZS').getValue(),
        fiscalYearStartMonth: 7,
      });

      await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) => new TypeOrmCompanyProfileRepository(ctx.manager).save(profile)),
      );

      const found = await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmCompanyProfileRepository(ctx.manager).findByOrgUnitId(orgUnitId()),
        ),
      );
      expect(found?.legalName).toBe('Afribiz Holdings Ltd');

      const foundUnderOtherTenant = await tenantContext.run(OTHER_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmCompanyProfileRepository(ctx.manager).findByOrgUnitId(orgUnitId()),
        ),
      );
      expect(foundUnderOtherTenant).toBeNull();

      const duplicate = CompanyProfile.create({
        tenantId,
        orgUnitId: orgUnitId(),
        legalName: 'Duplicate Ltd',
        registrationNumber: 'REG-999',
        taxIdentifier: TaxIdentifier.create(CountryCode.create('TZ').getValue(), '999').getValue(),
        functionalCurrency: CurrencyCode.create('TZS').getValue(),
        fiscalYearStartMonth: 1,
      });
      await expect(
        tenantContext.run(TEST_TENANT_ID, () =>
          unitOfWork.withTransaction((ctx) =>
            new TypeOrmCompanyProfileRepository(ctx.manager).save(duplicate),
          ),
        ),
      ).rejects.toThrow();

      const stale = CompanyProfile.reconstitute({
        id: profile.id,
        tenantId,
        orgUnitId: orgUnitId(),
        legalName: 'Stale Update',
        registrationNumber: 'REG-001',
        taxIdentifier: profile.taxIdentifier,
        functionalCurrency: profile.functionalCurrency,
        fiscalYearStartMonth: 7,
        version: profile.version + 99,
      });
      await expect(
        tenantContext.run(TEST_TENANT_ID, () =>
          unitOfWork.withTransaction((ctx) => new TypeOrmCompanyProfileRepository(ctx.manager).save(stale)),
        ),
      ).rejects.toBeInstanceOf(ConcurrencyDomainException);
    });

    it('rejects an orphan org_unit_id via the FK constraint', async () => {
      await expect(
        insertExpectingFkRejection(
          `INSERT INTO "company_profile"
             ("id", "tenant_id", "org_unit_id", "legal_name", "registration_number",
              "tax_country_code", "tax_number", "functional_currency", "fiscal_year_start_month")
           VALUES (gen_random_uuid(), $1, gen_random_uuid(), 'Orphan', 'REG', 'TZ', '1', 'TZS', 1)`,
          [TEST_TENANT_ID],
        ),
      ).rejects.toThrow();
    });
  });

  describe('BranchProfile', () => {
    it('saves, finds, and rejects a stale CAS update', async () => {
      const orgUnitId = orgUnitByCode.get('BRANCH')!.id;
      const profile = BranchProfile.create({
        tenantId,
        orgUnitId,
        address: Address.create({
          line1: 'Moi Avenue',
          city: 'Nairobi',
          countryCode: CountryCode.create('KE').getValue(),
        }).getValue(),
        operatingCurrency: CurrencyCode.create('KES').getValue(),
      });

      await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) => new TypeOrmBranchProfileRepository(ctx.manager).save(profile)),
      );

      const found = await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmBranchProfileRepository(ctx.manager).findByOrgUnitId(orgUnitId),
        ),
      );
      expect(found?.address.city).toBe('Nairobi');

      const foundUnderOtherTenant = await tenantContext.run(OTHER_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmBranchProfileRepository(ctx.manager).findByOrgUnitId(orgUnitId),
        ),
      );
      expect(foundUnderOtherTenant).toBeNull();

      const stale = BranchProfile.reconstitute({
        id: profile.id,
        tenantId,
        orgUnitId,
        address: profile.address,
        operatingCurrency: profile.operatingCurrency,
        contactPhone: null,
        contactEmail: null,
        version: profile.version + 99,
      });
      await expect(
        tenantContext.run(TEST_TENANT_ID, () =>
          unitOfWork.withTransaction((ctx) => new TypeOrmBranchProfileRepository(ctx.manager).save(stale)),
        ),
      ).rejects.toBeInstanceOf(ConcurrencyDomainException);
    });

    it('rejects an orphan org_unit_id via the FK constraint', async () => {
      await expect(
        insertExpectingFkRejection(
          `INSERT INTO "branch_profile"
             ("id", "tenant_id", "org_unit_id", "address_line1", "address_city",
              "address_country_code", "operating_currency")
           VALUES (gen_random_uuid(), $1, gen_random_uuid(), 'Line 1', 'City', 'KE', 'KES')`,
          [TEST_TENANT_ID],
        ),
      ).rejects.toThrow();
    });
  });

  describe('DepartmentProfile', () => {
    it('saves with a valid cost center link, finds, and rejects a stale CAS update', async () => {
      const orgUnitId = orgUnitByCode.get('DEPARTMENT')!.id;
      const costCenterOrgUnitId = orgUnitByCode.get('COST_CENTER')!.id;
      const profile = DepartmentProfile.create({ tenantId, orgUnitId, costCenterOrgUnitId });

      await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) => new TypeOrmDepartmentProfileRepository(ctx.manager).save(profile)),
      );

      const found = await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmDepartmentProfileRepository(ctx.manager).findByOrgUnitId(orgUnitId),
        ),
      );
      expect(found?.costCenterOrgUnitId?.equals(costCenterOrgUnitId)).toBe(true);

      const stale = DepartmentProfile.reconstitute({
        id: profile.id,
        tenantId,
        orgUnitId,
        costCenterOrgUnitId,
        managerReference: null,
        version: profile.version + 99,
      });
      await expect(
        tenantContext.run(TEST_TENANT_ID, () =>
          unitOfWork.withTransaction((ctx) =>
            new TypeOrmDepartmentProfileRepository(ctx.manager).save(stale),
          ),
        ),
      ).rejects.toBeInstanceOf(ConcurrencyDomainException);
    });

    it('rejects an orphan org_unit_id via the FK constraint', async () => {
      await expect(
        insertExpectingFkRejection(
          `INSERT INTO "department_profile" ("id", "tenant_id", "org_unit_id")
           VALUES (gen_random_uuid(), $1, gen_random_uuid())`,
          [TEST_TENANT_ID],
        ),
      ).rejects.toThrow();
    });
  });

  describe('CostCenterProfile', () => {
    it('saves, finds, and rejects a stale CAS update', async () => {
      const orgUnitId = orgUnitByCode.get('COST_CENTER')!.id;
      const budget = Money.create('50000.00', CurrencyCode.create('TZS').getValue()).getValue();
      const profile = CostCenterProfile.create({
        tenantId,
        orgUnitId,
        budget,
        budgetPeriodStart: new Date('2026-01-01'),
        budgetPeriodEnd: new Date('2026-12-31'),
      });

      await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) => new TypeOrmCostCenterProfileRepository(ctx.manager).save(profile)),
      );

      const found = await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmCostCenterProfileRepository(ctx.manager).findByOrgUnitId(orgUnitId),
        ),
      );
      expect(found?.budget.amount).toBe('50000.0000');

      const stale = CostCenterProfile.reconstitute({
        id: profile.id,
        tenantId,
        orgUnitId,
        budget,
        budgetPeriodStart: profile.budgetPeriodStart,
        budgetPeriodEnd: profile.budgetPeriodEnd,
        glAccountCode: null,
        version: profile.version + 99,
      });
      await expect(
        tenantContext.run(TEST_TENANT_ID, () =>
          unitOfWork.withTransaction((ctx) =>
            new TypeOrmCostCenterProfileRepository(ctx.manager).save(stale),
          ),
        ),
      ).rejects.toBeInstanceOf(ConcurrencyDomainException);
    });

    it('rejects an orphan org_unit_id via the FK constraint', async () => {
      await expect(
        insertExpectingFkRejection(
          `INSERT INTO "cost_center_profile"
             ("id", "tenant_id", "org_unit_id", "budget_amount", "budget_currency",
              "budget_period_start", "budget_period_end")
           VALUES (gen_random_uuid(), $1, gen_random_uuid(), 100, 'TZS', '2026-01-01', '2026-12-31')`,
          [TEST_TENANT_ID],
        ),
      ).rejects.toThrow();
    });
  });

  describe('ProfitCenterProfile', () => {
    it('saves, finds, and rejects a stale CAS update', async () => {
      const orgUnitId = orgUnitByCode.get('PROFIT_CENTER')!.id;
      const usd = CurrencyCode.create('USD').getValue();
      const target = Money.create('250000.00', usd).getValue();
      const profile = ProfitCenterProfile.create({
        tenantId,
        orgUnitId,
        revenueTarget: target,
        reportingCurrency: usd,
      });

      await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) => new TypeOrmProfitCenterProfileRepository(ctx.manager).save(profile)),
      );

      const found = await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmProfitCenterProfileRepository(ctx.manager).findByOrgUnitId(orgUnitId),
        ),
      );
      expect(found?.revenueTarget.amount).toBe('250000.0000');

      const stale = ProfitCenterProfile.reconstitute({
        id: profile.id,
        tenantId,
        orgUnitId,
        revenueTarget: target,
        reportingCurrency: usd,
        glAccountCode: null,
        version: profile.version + 99,
      });
      await expect(
        tenantContext.run(TEST_TENANT_ID, () =>
          unitOfWork.withTransaction((ctx) =>
            new TypeOrmProfitCenterProfileRepository(ctx.manager).save(stale),
          ),
        ),
      ).rejects.toBeInstanceOf(ConcurrencyDomainException);
    });

    it('rejects an orphan org_unit_id via the FK constraint', async () => {
      await expect(
        insertExpectingFkRejection(
          `INSERT INTO "profit_center_profile"
             ("id", "tenant_id", "org_unit_id", "revenue_target_amount", "revenue_target_currency",
              "reporting_currency")
           VALUES (gen_random_uuid(), $1, gen_random_uuid(), 100, 'USD', 'USD')`,
          [TEST_TENANT_ID],
        ),
      ).rejects.toThrow();
    });
  });

  describe('assertOrgUnitType (application-layer type-binding rule)', () => {
    it('throws BusinessRuleViolationException when the org unit type does not match the expected profile type', async () => {
      const branchOrgUnit = orgUnitByCode.get('BRANCH')!;
      const branchType = await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmOrgUnitTypeRepository(ctx.manager).findById(branchOrgUnit.orgUnitTypeId),
        ),
      );

      expect(() => assertOrgUnitType(branchOrgUnit, branchType!, 'COMPANY')).toThrow(
        BusinessRuleViolationException,
      );
    });

    it('does not throw when the org unit type matches', async () => {
      const companyOrgUnit = orgUnitByCode.get('COMPANY')!;
      const companyType = await tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          new TypeOrmOrgUnitTypeRepository(ctx.manager).findById(companyOrgUnit.orgUnitTypeId),
        ),
      );

      expect(() => assertOrgUnitType(companyOrgUnit, companyType!, 'COMPANY')).not.toThrow();
    });
  });
});
