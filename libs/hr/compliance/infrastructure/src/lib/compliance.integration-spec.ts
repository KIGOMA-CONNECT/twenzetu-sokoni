import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ComplianceRequirement, EmployeeComplianceRecord } from '@abms/hr-compliance-domain';
import { HR_ENTITIES } from '@abms/hr-infrastructure';
import { DataSource } from 'typeorm';
import { HR_COMPLIANCE_ENTITIES } from './hr-compliance-entities';
import { TypeOrmComplianceRequirementRepository } from './repositories/typeorm-compliance-requirement.repository';
import { TypeOrmEmployeeComplianceRecordRepository } from './repositories/typeorm-employee-compliance-record.repository';

const TEST_TENANT_ID = '11111111-2222-4333-8444-555555555556';

interface PolicyRow {
  policyname: string;
}

describe('Compliance tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

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
      entities: [...HR_COMPLIANCE_ENTITIES, ...HR_ENTITIES],
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee_compliance_record" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "compliance_requirement" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('creates a requirement, assigns it to an employee, and marks the record compliant', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());

    const requirement = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmComplianceRequirementRepository(ctx.manager);
        const newRequirement = ComplianceRequirement.create({
          tenantId,
          name: 'Annual Fire Safety Certification',
          description: null,
          category: 'SAFETY',
          recurrence: 'ANNUAL',
        });
        await repository.save(newRequirement);
        return newRequirement;
      }),
    );

    const record = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmEmployeeComplianceRecordRepository(ctx.manager);
        const newRecord = EmployeeComplianceRecord.assign({
          tenantId,
          employeeId,
          complianceRequirementId: requirement.id,
          dueDate: new Date('2026-12-31'),
        });
        await repository.save(newRecord);
        return newRecord;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmEmployeeComplianceRecordRepository(ctx.manager);
        const loaded = await repository.findById(record.id);
        loaded?.markCompliant(new Date('2026-11-15'));
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmEmployeeComplianceRecordRepository(ctx.manager).findById(record.id),
      ),
    );
    expect(reloaded?.status).toBe('COMPLIANT');
    expect(reloaded?.completedDate).toEqual(new Date('2026-11-15'));
  });

  it('has an RLS policy on every compliance table', async () => {
    for (const table of ['compliance_requirement', 'employee_compliance_record']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
