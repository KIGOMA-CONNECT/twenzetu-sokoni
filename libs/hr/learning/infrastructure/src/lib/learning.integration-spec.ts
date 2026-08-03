import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { Course, CourseEnrollment } from '@abms/hr-learning-domain';
import { HR_ENTITIES } from '@abms/hr-infrastructure';
import { DataSource } from 'typeorm';
import { HR_LEARNING_ENTITIES } from './hr-learning-entities';
import { TypeOrmCourseEnrollmentRepository } from './repositories/typeorm-course-enrollment.repository';
import { TypeOrmCourseRepository } from './repositories/typeorm-course.repository';

const TEST_TENANT_ID = '11111111-2222-4333-8444-555555555555';

interface PolicyRow {
  policyname: string;
}

describe('Learning tables correctness (integration)', () => {
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
      entities: [...HR_LEARNING_ENTITIES, ...HR_ENTITIES],
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "course_enrollment" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "course" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('creates a course, enrolls an employee, and completes the enrollment', async () => {
    const employeeId = EntityId.create();
    await insertTestEmployee(employeeId.toValue());

    const course = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmCourseRepository(ctx.manager);
        const newCourse = Course.create({
          tenantId,
          title: 'Workplace Safety',
          description: null,
          durationHours: 4,
          category: 'COMPLIANCE',
        });
        await repository.save(newCourse);
        return newCourse;
      }),
    );

    const enrollment = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmCourseEnrollmentRepository(ctx.manager);
        const newEnrollment = CourseEnrollment.enroll({
          tenantId,
          employeeId,
          courseId: course.id,
          enrolledDate: new Date('2026-08-01'),
        });
        await repository.save(newEnrollment);
        return newEnrollment;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmCourseEnrollmentRepository(ctx.manager);
        const loaded = await repository.findById(enrollment.id);
        loaded?.complete(new Date('2026-08-05'), 95);
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const reloaded = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmCourseEnrollmentRepository(ctx.manager).findById(enrollment.id),
      ),
    );
    expect(reloaded?.status).toBe('COMPLETED');
    expect(reloaded?.score).toBe(95);
  });

  it('has an RLS policy on every learning table', async () => {
    for (const table of ['course', 'course_enrollment']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
