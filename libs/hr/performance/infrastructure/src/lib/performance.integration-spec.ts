import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { Goal, PerformanceReview, ReviewCycle } from '@abms/hr-performance-domain';
import { HR_ENTITIES } from '@abms/hr-infrastructure';
import { DataSource } from 'typeorm';
import { HR_PERFORMANCE_ENTITIES } from './hr-performance-entities';
import { TypeOrmGoalRepository } from './repositories/typeorm-goal.repository';
import { TypeOrmPerformanceReviewRepository } from './repositories/typeorm-performance-review.repository';
import { TypeOrmReviewCycleRepository } from './repositories/typeorm-review-cycle.repository';

const TEST_TENANT_ID = '88888888-8888-4888-8888-888888888888';

interface PolicyRow {
  policyname: string;
}

describe('Performance tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

  // goal/performance_review both FK to "employee", which belongs to
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
      entities: [...HR_PERFORMANCE_ENTITIES, ...HR_ENTITIES],
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "performance_review" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "review_cycle" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "goal" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('sets a goal, updates progress, and completes it', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());

    const goal = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmGoalRepository(ctx.manager);
        const newGoal = Goal.set({
          tenantId,
          employeeId,
          title: 'Ship v1',
          description: null,
          targetDate: new Date('2026-12-31'),
        });
        await repository.save(newGoal);
        return newGoal;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmGoalRepository(ctx.manager);
        const loaded = await repository.findById(goal.id);
        loaded?.updateProgress(60);
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmGoalRepository(ctx.manager);
        const loaded = await repository.findById(goal.id);
        loaded?.complete();
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmGoalRepository(ctx.manager).findById(goal.id)),
    );
    expect(reloaded?.status).toBe('COMPLETED');
    expect(reloaded?.progressPercent).toBe(100);
  });

  it('opens a review cycle, starts a review, submits and acknowledges it', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());

    const cycle = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmReviewCycleRepository(ctx.manager);
        const newCycle = ReviewCycle.open({
          tenantId,
          name: '2026 H2',
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-12-31'),
        });
        await repository.save(newCycle);
        return newCycle;
      }),
    );

    const reviewerUserId = EntityId.create().toValue();
    const review = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmPerformanceReviewRepository(ctx.manager);
        const newReview = PerformanceReview.start({
          tenantId,
          employeeId,
          reviewCycleId: cycle.id,
          reviewerUserId,
        });
        await repository.save(newReview);
        return newReview;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmPerformanceReviewRepository(ctx.manager);
        const loaded = await repository.findById(review.id);
        loaded?.submit(4, 'Solid quarter.');
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmPerformanceReviewRepository(ctx.manager);
        const loaded = await repository.findById(review.id);
        loaded?.acknowledge();
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmPerformanceReviewRepository(ctx.manager).findById(review.id),
      ),
    );
    expect(reloaded?.status).toBe('ACKNOWLEDGED');
    expect(reloaded?.rating).toBe(4);
  });

  it('has an RLS policy on every performance table', async () => {
    for (const table of ['goal', 'review_cycle', 'performance_review']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
