import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { BenefitEnrollment, BenefitPlan, SalaryRevision } from '@abms/hr-compensation-domain';
import { HR_ENTITIES } from '@abms/hr-infrastructure';
import { HR_PAYROLL_ENTITIES, TypeOrmSalaryStructureRepository } from '@abms/hr-payroll-infrastructure';
import { SalaryStructure } from '@abms/hr-payroll-domain';
import { DataSource } from 'typeorm';
import { HR_COMPENSATION_ENTITIES } from './hr-compensation-entities';
import { TypeOrmBenefitEnrollmentRepository } from './repositories/typeorm-benefit-enrollment.repository';
import { TypeOrmBenefitPlanRepository } from './repositories/typeorm-benefit-plan.repository';
import { TypeOrmSalaryRevisionRepository } from './repositories/typeorm-salary-revision.repository';

const TEST_TENANT_ID = '10101010-1010-4010-8010-101010101010';
const TZS = CurrencyCode.create('TZS').getValue();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

interface PolicyRow {
  policyname: string;
}

describe('Compensation tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

  // salary_revision/benefit_enrollment FK to "employee" (hr-infrastructure);
  // recording a revision also mutates "salary_structure" (hr-payroll-infrastructure)
  // in the same transaction — this test spreads both sets of entities into
  // the runtime DataSource, mirroring the same fixture pattern used by
  // Recruitment (ADR-0011) and Offboarding (ADR-0013).
  async function insertTestEmployee(employeeId: string): Promise<void> {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(
        `INSERT INTO "employee" (
          "id", "tenant_id", "employee_number", "first_name", "last_name", "email",
          "hire_date", "employment_type", "status", "version"
        ) VALUES ($1, $2, $3, 'Test', 'Employee', $4, '2026-01-01', 'FULL_TIME', 'ACTIVE', 1)`,
        [employeeId, TEST_TENANT_ID, `EMP-${employeeId.slice(0, 8)}`, `${employeeId}@example.com`],
      );
    });
  }

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
      entities: [...HR_COMPENSATION_ENTITIES, ...HR_ENTITIES, ...HR_PAYROLL_ENTITIES],
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "benefit_enrollment" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "benefit_plan" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "salary_revision" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "salary_structure" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('recording a salary revision mutates the active SalaryStructure and appends a WORM fact', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmSalaryStructureRepository(ctx.manager);
        const structure = SalaryStructure.create({
          tenantId,
          employeeId,
          basicSalary: tzs('500000'),
          allowances: [],
          effectiveFrom: new Date('2026-01-01'),
        });
        await repository.save(structure);
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const structureRepository = new TypeOrmSalaryStructureRepository(ctx.manager);
        const revisionRepository = new TypeOrmSalaryRevisionRepository(ctx.manager);

        const structure = await structureRepository.findActiveByEmployee(tenantId, employeeId);
        if (!structure) {
          throw new Error('Expected an active salary structure.');
        }
        const previousBasicSalary = structure.basicSalary;
        const newBasicSalary = tzs('600000');
        structure.updateBasicSalary(newBasicSalary);
        await structureRepository.save(structure);

        const revision = SalaryRevision.record({
          tenantId,
          employeeId,
          reason: 'MERIT_INCREASE',
          previousBasicSalary,
          newBasicSalary,
          effectiveDate: new Date('2026-08-01'),
        });
        await revisionRepository.append(revision);
      }),
    );

    const structure = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmSalaryStructureRepository(ctx.manager).findActiveByEmployee(tenantId, employeeId),
      ),
    );
    expect(structure?.basicSalary.amount).toBe('600000.0000');

    const revisions = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmSalaryRevisionRepository(ctx.manager).findByEmployeeId(tenantId, employeeId),
      ),
    );
    expect(revisions).toHaveLength(1);
    expect(revisions[0].previousBasicSalary.amount).toBe('500000.0000');
    expect(revisions[0].newBasicSalary.amount).toBe('600000.0000');
  });

  it('creates a benefit plan and enrolls/cancels an employee', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());

    const plan = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmBenefitPlanRepository(ctx.manager);
        const newPlan = BenefitPlan.create({
          tenantId,
          name: 'Gold Health Plan',
          benefitType: 'HEALTH_INSURANCE',
          employerContributionRateBasisPoints: 500,
        });
        await repository.save(newPlan);
        return newPlan;
      }),
    );

    const enrollment = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmBenefitEnrollmentRepository(ctx.manager);
        const newEnrollment = BenefitEnrollment.enroll({
          tenantId,
          employeeId,
          benefitPlanId: plan.id,
          effectiveDate: new Date('2026-08-01'),
        });
        await repository.save(newEnrollment);
        return newEnrollment;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmBenefitEnrollmentRepository(ctx.manager);
        const loaded = await repository.findById(enrollment.id);
        loaded?.cancel();
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmBenefitEnrollmentRepository(ctx.manager).findById(enrollment.id),
      ),
    );
    expect(reloaded?.status).toBe('CANCELLED');
  });

  it('has an RLS policy on every compensation table', async () => {
    for (const table of ['salary_revision', 'benefit_plan', 'benefit_enrollment']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });

  it('salary_revision has no UPDATE/DELETE grant for the runtime role (WORM)', async () => {
    const grants: Array<{ privilege_type: string }> = await ownerDataSource.query(
      `SELECT privilege_type FROM information_schema.role_table_grants
       WHERE table_name = 'salary_revision' AND grantee = 'abms_runtime'`,
    );
    const privileges = grants.map((row) => row.privilege_type);
    expect(privileges).not.toContain('UPDATE');
    expect(privileges).not.toContain('DELETE');
  });
});
