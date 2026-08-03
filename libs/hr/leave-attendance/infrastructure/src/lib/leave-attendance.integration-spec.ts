import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { AttendanceRecord, LeaveBalance, LeaveRequest, LeaveType } from '@abms/hr-leave-attendance-domain';
import { DataSource } from 'typeorm';
import { HR_LEAVE_ATTENDANCE_ENTITIES } from './hr-leave-attendance-entities';
import { TypeOrmAttendanceRecordRepository } from './repositories/typeorm-attendance-record.repository';
import { TypeOrmLeaveBalanceRepository } from './repositories/typeorm-leave-balance.repository';
import { TypeOrmLeaveRequestRepository } from './repositories/typeorm-leave-request.repository';
import { TypeOrmLeaveTypeRepository } from './repositories/typeorm-leave-type.repository';

const TEST_TENANT_ID = '66666666-6666-4666-8666-666666666666';

interface PolicyRow {
  policyname: string;
}

describe('Leave & Attendance tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

  // leave_balance/leave_request/attendance_record all FK to "employee", which
  // belongs to hr-infrastructure — a lib this one deliberately does not depend
  // on (opaque uuid refs, per ADR-0008). Insert a minimal row directly rather
  // than pulling in that lib just for test fixtures.
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
      entities: HR_LEAVE_ATTENDANCE_ENTITIES,
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "attendance_record" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "leave_request" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "leave_balance" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "leave_type" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('creates a leave type, allocates a balance, submits and approves a request — debiting the balance', async () => {
    const employeeId = EntityId.create();
    const approverUserId = EntityId.create().toValue();
    await insertTestEmployee(employeeId.toValue());

    const leaveType = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmLeaveTypeRepository(ctx.manager);
        const newLeaveType = LeaveType.create({
          tenantId,
          code: 'ANNUAL',
          name: 'Annual Leave',
          defaultDaysPerYear: 21,
          requiresApproval: true,
        });
        await repository.save(newLeaveType);
        return newLeaveType;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmLeaveBalanceRepository(ctx.manager);
        const balance = LeaveBalance.create({
          tenantId,
          employeeId,
          leaveTypeId: leaveType.id,
          year: 2026,
          allocatedDays: 21,
        });
        await repository.save(balance);
      }),
    );

    const leaveRequest = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmLeaveRequestRepository(ctx.manager);
        const request = LeaveRequest.submit({
          tenantId,
          employeeId,
          leaveTypeId: leaveType.id,
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-08-05'),
          numberOfDays: 5,
          reason: 'Family trip',
        });
        await repository.save(request);
        return request;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const balanceRepository = new TypeOrmLeaveBalanceRepository(ctx.manager);
        const requestRepository = new TypeOrmLeaveRequestRepository(ctx.manager);

        const balance = await balanceRepository.findByEmployeeLeaveTypeAndYear(
          tenantId,
          employeeId,
          leaveType.id,
          2026,
        );
        balance?.debit(5);
        if (balance) {
          await balanceRepository.save(balance);
        }

        const request = await requestRepository.findById(leaveRequest.id);
        request?.approve(approverUserId, 'Enjoy your trip.');
        if (request) {
          await requestRepository.save(request);
        }
      }),
    );

    const reloadedBalance = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmLeaveBalanceRepository(ctx.manager).findByEmployeeLeaveTypeAndYear(
          tenantId,
          employeeId,
          leaveType.id,
          2026,
        ),
      ),
    );
    expect(reloadedBalance?.usedDays).toBe(5);
    expect(reloadedBalance?.remainingDays).toBe(16);

    const reloadedRequest = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmLeaveRequestRepository(ctx.manager).findById(leaveRequest.id)),
    );
    expect(reloadedRequest?.status).toBe('APPROVED');
    expect(reloadedRequest?.decidedByUserId).toBe(approverUserId);
  });

  it('clocks an employee in and out, computing hoursWorked', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());
    const date = new Date('2026-08-10');
    const clockInTime = new Date('2026-08-10T08:00:00Z');
    const clockOutTime = new Date('2026-08-10T17:00:00Z');

    const record = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmAttendanceRecordRepository(ctx.manager);
        const newRecord = AttendanceRecord.clockIn({ tenantId, employeeId, date, clockInTime });
        await repository.save(newRecord);
        return newRecord;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmAttendanceRecordRepository(ctx.manager);
        const loaded = await repository.findById(record.id);
        loaded?.clockOut(clockOutTime);
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmAttendanceRecordRepository(ctx.manager).findById(record.id)),
    );
    expect(reloaded?.hoursWorked).toBe(9);
    expect(reloaded?.status).toBe('PRESENT');
  });

  it('has an RLS policy on every leave & attendance table', async () => {
    for (const table of ['leave_type', 'leave_balance', 'leave_request', 'attendance_record']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
