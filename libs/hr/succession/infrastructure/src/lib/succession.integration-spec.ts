import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { SuccessionCandidate, SuccessionPlan } from '@abms/hr-succession-domain';
import { HR_ENTITIES } from '@abms/hr-infrastructure';
import { DataSource } from 'typeorm';
import { HR_SUCCESSION_ENTITIES } from './hr-succession-entities';
import { TypeOrmSuccessionCandidateRepository } from './repositories/typeorm-succession-candidate.repository';
import { TypeOrmSuccessionPlanRepository } from './repositories/typeorm-succession-plan.repository';

const TEST_TENANT_ID = '66666666-7777-4888-8999-000000000000';

interface PolicyRow {
  policyname: string;
}

describe('Succession tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

  // succession_plan FKs to "position", succession_candidate FKs to
  // "employee" (both hr-infrastructure) — this lib deliberately does not
  // depend on that module (opaque uuid refs, per ADR-0009/ADR-0010's
  // precedent). Insert minimal rows directly rather than pulling in the
  // full module just for test fixtures.
  async function insertTestPosition(positionId: string): Promise<void> {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(
        `INSERT INTO "position" ("id", "tenant_id", "code", "title", "is_active")
         VALUES ($1, $2, $3, 'VP of Engineering', true)`,
        [positionId, TEST_TENANT_ID, `POS-${positionId.slice(0, 8)}`],
      );
    });
  }

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
      entities: [...HR_SUCCESSION_ENTITIES, ...HR_ENTITIES],
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "succession_candidate" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "succession_plan" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "position" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('opens a plan, nominates a candidate, and updates readiness', async () => {
    const positionId = EntityId.create();
    const employeeId = EntityId.create();
    await insertTestPosition(positionId.toValue());
    await insertTestEmployee(employeeId.toValue());

    const plan = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmSuccessionPlanRepository(ctx.manager);
        const newPlan = SuccessionPlan.open({ tenantId, positionId, notes: 'Critical leadership role' });
        await repository.save(newPlan);
        return newPlan;
      }),
    );

    const candidate = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmSuccessionCandidateRepository(ctx.manager);
        const newCandidate = SuccessionCandidate.nominate({
          tenantId,
          successionPlanId: plan.id,
          employeeId,
          readinessLevel: 'NOT_READY',
          notes: null,
        });
        await repository.save(newCandidate);
        return newCandidate;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmSuccessionCandidateRepository(ctx.manager);
        const loaded = await repository.findById(candidate.id);
        loaded?.updateReadiness('READY_NOW', 'Promoted after strong Q3 performance');
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmSuccessionCandidateRepository(ctx.manager).findById(candidate.id),
      ),
    );
    expect(reloaded?.readinessLevel).toBe('READY_NOW');
    expect(reloaded?.notes).toBe('Promoted after strong Q3 performance');
  });

  it('has an RLS policy on every succession table', async () => {
    for (const table of ['succession_plan', 'succession_candidate']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
