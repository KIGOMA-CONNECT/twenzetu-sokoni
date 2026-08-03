import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { OffboardingCase, OffboardingTask } from '@abms/hr-offboarding-domain';
import { HR_ENTITIES, TypeOrmEmployeeRepository } from '@abms/hr-infrastructure';
import { DataSource } from 'typeorm';
import { HR_OFFBOARDING_ENTITIES } from './hr-offboarding-entities';
import { TypeOrmOffboardingCaseRepository } from './repositories/typeorm-offboarding-case.repository';
import { TypeOrmOffboardingTaskRepository } from './repositories/typeorm-offboarding-task.repository';

const TEST_TENANT_ID = '99999999-9999-4999-8999-999999999999';

interface PolicyRow {
  policyname: string;
}

describe('Offboarding tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

  // offboarding_case/offboarding_task both FK to "employee", which belongs to
  // hr-infrastructure — a lib this one deliberately does not depend on for
  // fixtures (opaque uuid refs everywhere else). Insert a minimal row directly.
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
      entities: [...HR_OFFBOARDING_ENTITIES, ...HR_ENTITIES],
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "offboarding_task" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "offboarding_case" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('initiates a case, completes a task, and completing the case terminates the Employee', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());

    const offboardingCase = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmOffboardingCaseRepository(ctx.manager);
        const newCase = OffboardingCase.initiate({
          tenantId,
          employeeId,
          exitReason: 'RESIGNATION',
          lastWorkingDay: new Date('2026-08-15'),
        });
        await repository.save(newCase);
        return newCase;
      }),
    );

    const task = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmOffboardingTaskRepository(ctx.manager);
        const newTask = OffboardingTask.create({
          tenantId,
          offboardingCaseId: offboardingCase.id,
          employeeId,
          name: 'Return company equipment',
        });
        await repository.save(newTask);
        return newTask;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmOffboardingTaskRepository(ctx.manager);
        const loaded = await repository.findById(task.id);
        loaded?.complete();
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const caseRepository = new TypeOrmOffboardingCaseRepository(ctx.manager);
        const employeeRepository = new TypeOrmEmployeeRepository(ctx.manager);
        const loadedCase = await caseRepository.findById(offboardingCase.id);
        loadedCase?.complete();
        if (loadedCase) {
          await caseRepository.save(loadedCase);
        }
        const employee = await employeeRepository.findById(employeeId);
        employee?.terminate(offboardingCase.lastWorkingDay);
        if (employee) {
          await employeeRepository.save(employee);
        }
      }),
    );

    const reloadedCase = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmOffboardingCaseRepository(ctx.manager).findById(offboardingCase.id),
      ),
    );
    expect(reloadedCase?.status).toBe('COMPLETED');

    const reloadedEmployee = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmEmployeeRepository(ctx.manager).findById(employeeId)),
    );
    expect(reloadedEmployee?.status).toBe('TERMINATED');
  });

  it('has an RLS policy on every offboarding table', async () => {
    for (const table of ['offboarding_case', 'offboarding_task']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
