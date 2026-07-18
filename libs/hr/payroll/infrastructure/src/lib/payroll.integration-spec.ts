import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { createTanzaniaStatutoryRatesV1, Payslip, PayrollPeriod, SalaryStructure } from '@abms/hr-payroll-domain';
import { DataSource } from 'typeorm';
import { HR_PAYROLL_ENTITIES } from './hr-payroll-entities';
import { TypeOrmPayrollPeriodRepository } from './repositories/typeorm-payroll-period.repository';
import { TypeOrmPayslipRepository } from './repositories/typeorm-payslip.repository';
import { TypeOrmSalaryStructureRepository } from './repositories/typeorm-salary-structure.repository';

const TEST_TENANT_ID = '77777777-7777-4777-8777-777777777777';
const TZS = CurrencyCode.create('TZS').getValue();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

interface PolicyRow {
  policyname: string;
}

describe('Payroll tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

  // salary_structure/payslip both FK to "employee", which belongs to
  // hr-infrastructure — a lib this one deliberately does not depend on
  // (opaque uuid refs, per ADR-0008/ADR-0010). Insert a minimal row directly
  // rather than pulling in that lib just for test fixtures.
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
      entities: HR_PAYROLL_ENTITIES,
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "payslip" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "payroll_period" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "salary_structure" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('sets a salary structure, opens a period, generates and approves a payslip', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());

    const structure = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmSalaryStructureRepository(ctx.manager);
        const newStructure = SalaryStructure.create({
          tenantId,
          employeeId,
          basicSalary: tzs('500000'),
          allowances: [{ name: 'Transport', amount: tzs('50000') }],
          effectiveFrom: new Date('2026-01-01'),
        });
        await repository.save(newStructure);
        return newStructure;
      }),
    );
    expect(structure.grossMonthlySalary.amount).toBe('550000.0000');

    const period = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmPayrollPeriodRepository(ctx.manager);
        const newPeriod = PayrollPeriod.open({ tenantId, year: 2026, month: 8 });
        await repository.save(newPeriod);
        return newPeriod;
      }),
    );

    const payslip = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmPayslipRepository(ctx.manager);
        const structureRepository = new TypeOrmSalaryStructureRepository(ctx.manager);
        const loadedStructure = await structureRepository.findActiveByEmployee(tenantId, employeeId);
        if (!loadedStructure) {
          throw new Error('Expected an active salary structure for this employee.');
        }
        const newPayslip = Payslip.generate({
          tenantId,
          employeeId,
          payrollPeriodId: period.id,
          basicSalary: loadedStructure.basicSalary,
          allowances: loadedStructure.allowances,
          statutoryRates: createTanzaniaStatutoryRatesV1(),
        });
        await repository.save(newPayslip);
        return newPayslip;
      }),
    );
    // gross 550000: PAYE band2 (520000-270000)*8%=20000 + band3 (550000-520000)*20%=6000 = 26000
    // nssfEmployee = 550000*10% = 55000; net = 550000 - 26000 - 55000 = 469000
    expect(payslip.netPay.amount).toBe('469000.0000');

    const approverUserId = EntityId.create().toValue();
    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmPayslipRepository(ctx.manager);
        const loaded = await repository.findById(payslip.id);
        loaded?.approve(approverUserId);
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmPayslipRepository(ctx.manager).findById(payslip.id)),
    );
    expect(reloaded?.status).toBe('APPROVED');
  });

  it('has an RLS policy on every payroll table', async () => {
    for (const table of ['salary_structure', 'payroll_period', 'payslip']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
