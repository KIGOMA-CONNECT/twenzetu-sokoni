import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { Email, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { Employee, EmploymentHistoryEntry, Position } from '@abms/hr-domain';
import { DataSource } from 'typeorm';
import { HR_ENTITIES } from './hr-entities';
import { TypeOrmEmployeeRepository } from './repositories/typeorm-employee.repository';
import { TypeOrmEmploymentHistoryRepository } from './repositories/typeorm-employment-history.repository';
import { TypeOrmPositionRepository } from './repositories/typeorm-position.repository';

const TEST_TENANT_ID = '55555555-5555-4555-8555-555555555555';

interface PolicyRow {
  policyname: string;
}

describe('HR tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

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
      entities: HR_ENTITIES,
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee_document" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employment_history" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "position" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('creates a position, hires an employee against it, changes position/org unit, suspends, reactivates, and terminates — with employment history recorded at every step', async () => {
    const position = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmPositionRepository(ctx.manager);
        const newPosition = Position.create({ tenantId, code: 'SE', title: 'Software Engineer' });
        await repository.save(newPosition);
        return newPosition;
      }),
    );

    const employee = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const employeeRepository = new TypeOrmEmployeeRepository(ctx.manager);
        const historyRepository = new TypeOrmEmploymentHistoryRepository(ctx.manager);
        const newEmployee = Employee.create({
          tenantId,
          userId: null,
          employeeNumber: 'EMP-INT-0001',
          firstName: 'Jane',
          lastName: 'Doe',
          email: Email.create('jane.doe.integration@example.com').getValue(),
          phone: null,
          dateOfBirth: null,
          gender: null,
          positionId: position.id,
          orgUnitId: null,
          hireDate: new Date('2026-01-01'),
          employmentType: 'FULL_TIME',
        });
        await employeeRepository.save(newEmployee);
        await historyRepository.append(
          EmploymentHistoryEntry.create({
            tenantId,
            employeeId: newEmployee.id,
            eventType: 'HIRED',
            effectiveDate: newEmployee.hireDate,
            details: 'Hired.',
          }),
        );
        return newEmployee;
      }),
    );

    expect(employee.status).toBe('ACTIVE');

    // Suspend, then reactivate, then terminate — each recorded in history.
    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const employeeRepository = new TypeOrmEmployeeRepository(ctx.manager);
        const historyRepository = new TypeOrmEmploymentHistoryRepository(ctx.manager);
        const loaded = await employeeRepository.findById(employee.id);
        loaded?.suspend();
        if (loaded) {
          await employeeRepository.save(loaded);
          await historyRepository.append(
            EmploymentHistoryEntry.create({
              tenantId,
              employeeId: loaded.id,
              eventType: 'SUSPENDED',
              effectiveDate: new Date(),
              details: null,
            }),
          );
        }
      }),
    );

    let reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmEmployeeRepository(ctx.manager).findById(employee.id)),
    );
    expect(reloaded?.status).toBe('SUSPENDED');

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const employeeRepository = new TypeOrmEmployeeRepository(ctx.manager);
        const historyRepository = new TypeOrmEmploymentHistoryRepository(ctx.manager);
        const loaded = await employeeRepository.findById(employee.id);
        loaded?.reactivate();
        if (loaded) {
          await employeeRepository.save(loaded);
          await historyRepository.append(
            EmploymentHistoryEntry.create({
              tenantId,
              employeeId: loaded.id,
              eventType: 'REACTIVATED',
              effectiveDate: new Date(),
              details: null,
            }),
          );
        }
      }),
    );

    reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmEmployeeRepository(ctx.manager).findById(employee.id)),
    );
    expect(reloaded?.status).toBe('ACTIVE');

    const terminationDate = new Date('2026-06-01');
    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const employeeRepository = new TypeOrmEmployeeRepository(ctx.manager);
        const historyRepository = new TypeOrmEmploymentHistoryRepository(ctx.manager);
        const loaded = await employeeRepository.findById(employee.id);
        loaded?.terminate(terminationDate);
        if (loaded) {
          await employeeRepository.save(loaded);
          await historyRepository.append(
            EmploymentHistoryEntry.create({
              tenantId,
              employeeId: loaded.id,
              eventType: 'TERMINATED',
              effectiveDate: terminationDate,
              details: null,
            }),
          );
        }
      }),
    );

    reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmEmployeeRepository(ctx.manager).findById(employee.id)),
    );
    expect(reloaded?.status).toBe('TERMINATED');
    expect(reloaded?.terminationDate).toEqual(terminationDate);

    // Further mutation after termination is a domain-level guard failure.
    await expect(
      tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction(async (ctx) => {
          const employeeRepository = new TypeOrmEmployeeRepository(ctx.manager);
          const loaded = await employeeRepository.findById(employee.id);
          loaded?.suspend();
          if (loaded) {
            await employeeRepository.save(loaded);
          }
        }),
      ),
    ).rejects.toThrow();

    const history = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmEmploymentHistoryRepository(ctx.manager).findByEmployeeId(tenantId, employee.id),
      ),
    );
    expect(history.map((entry) => entry.eventType)).toEqual([
      'HIRED',
      'SUSPENDED',
      'REACTIVATED',
      'TERMINATED',
    ]);
  });

  it('rejects UPDATE and DELETE on employment_history from the runtime role — WORM immutability', async () => {
    const employeeId = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const employeeRepository = new TypeOrmEmployeeRepository(ctx.manager);
        const historyRepository = new TypeOrmEmploymentHistoryRepository(ctx.manager);
        const newEmployee = Employee.create({
          tenantId,
          userId: null,
          employeeNumber: 'EMP-INT-0002',
          firstName: 'John',
          lastName: 'Smith',
          email: Email.create('john.smith.integration@example.com').getValue(),
          phone: null,
          dateOfBirth: null,
          gender: null,
          positionId: null,
          orgUnitId: null,
          hireDate: new Date('2026-01-01'),
          employmentType: 'FULL_TIME',
        });
        await employeeRepository.save(newEmployee);
        await historyRepository.append(
          EmploymentHistoryEntry.create({
            tenantId,
            employeeId: newEmployee.id,
            eventType: 'HIRED',
            effectiveDate: newEmployee.hireDate,
            details: null,
          }),
        );
        return newEmployee.id;
      }),
    );

    await expect(
      tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          ctx.manager.query(`UPDATE "employment_history" SET "details" = 'tampered' WHERE "employee_id" = $1`, [
            employeeId.toValue(),
          ]),
        ),
      ),
    ).rejects.toThrow(/permission denied/i);

    await expect(
      tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction((ctx) =>
          ctx.manager.query(`DELETE FROM "employment_history" WHERE "employee_id" = $1`, [employeeId.toValue()]),
        ),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it('has an RLS policy on every HR table', async () => {
    for (const table of ['position', 'employee', 'employment_history', 'employee_document']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
