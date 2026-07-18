import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { Email, EntityId, TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { Application, Candidate, JobRequisition, OnboardingTask } from '@abms/hr-recruitment-domain';
import { Employee, EmploymentHistoryEntry } from '@abms/hr-domain';
import { HR_ENTITIES, TypeOrmEmployeeRepository, TypeOrmEmploymentHistoryRepository } from '@abms/hr-infrastructure';
import { DataSource } from 'typeorm';
import { HR_RECRUITMENT_ENTITIES } from './hr-recruitment-entities';
import { TypeOrmApplicationRepository } from './repositories/typeorm-application.repository';
import { TypeOrmCandidateRepository } from './repositories/typeorm-candidate.repository';
import { TypeOrmJobRequisitionRepository } from './repositories/typeorm-job-requisition.repository';
import { TypeOrmOnboardingTaskRepository } from './repositories/typeorm-onboarding-task.repository';

const TEST_TENANT_ID = '88888888-8888-4888-8888-888888888888';

interface PolicyRow {
  policyname: string;
}

describe('Recruitment & Onboarding tables correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

  // job_requisition FKs to "position", which belongs to hr-infrastructure —
  // a lib this one deliberately does not depend on for the requisition/
  // candidate/application chain (opaque uuid refs, per ADR-0008/0009/0010).
  // Insert a minimal row directly for the same reason those integration
  // tests do. HireCandidateHandler is the one deliberate exception (see
  // ADR-0011) — it genuinely depends on hr-domain/hr-infrastructure, so this
  // test exercises that real dependency rather than working around it.
  async function insertTestPosition(positionId: string): Promise<void> {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(
        `INSERT INTO "position" ("id", "tenant_id", "code", "title", "is_active") VALUES ($1, $2, $3, 'Software Engineer', true)`,
        [positionId, TEST_TENANT_ID, `POS-${positionId.slice(0, 8)}`],
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
      entities: [...HR_RECRUITMENT_ENTITIES, ...HR_ENTITIES],
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "onboarding_task" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employment_history" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "employee" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "application" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "candidate" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "job_requisition" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "position" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('walks a candidate from application through hire — creating a real Employee row in the same transaction', async () => {
    const positionId = EntityId.create();
    await insertTestPosition(positionId.toValue());

    const requisition = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmJobRequisitionRepository(ctx.manager);
        const newRequisition = JobRequisition.open({
          tenantId,
          positionId,
          title: 'Software Engineer',
          headcount: 1,
        });
        await repository.save(newRequisition);
        return newRequisition;
      }),
    );

    const candidate = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmCandidateRepository(ctx.manager);
        const newCandidate = Candidate.register({
          tenantId,
          firstName: 'Amina',
          lastName: 'Juma',
          email: Email.create('amina.juma.recruitment@example.com').getValue(),
          phone: null,
          resumeUrl: null,
          source: 'LinkedIn',
        });
        await repository.save(newCandidate);
        return newCandidate;
      }),
    );

    const application = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmApplicationRepository(ctx.manager);
        const newApplication = Application.submit({
          tenantId,
          candidateId: candidate.id,
          jobRequisitionId: requisition.id,
        });
        await repository.save(newApplication);
        return newApplication;
      }),
    );

    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmApplicationRepository(ctx.manager);
        const loaded = await repository.findById(application.id);
        loaded?.advanceToScreening();
        loaded?.advanceToInterviewing();
        loaded?.makeOffer();
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const employeeId = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const applicationRepository = new TypeOrmApplicationRepository(ctx.manager);
        const employeeRepository = new TypeOrmEmployeeRepository(ctx.manager);
        const historyRepository = new TypeOrmEmploymentHistoryRepository(ctx.manager);
        const onboardingTaskRepository = new TypeOrmOnboardingTaskRepository(ctx.manager);

        const loaded = await applicationRepository.findById(application.id);
        if (!loaded) {
          throw new Error('Expected the application to exist.');
        }
        loaded.hire();

        const newEmployee = Employee.create({
          tenantId,
          userId: null,
          employeeNumber: 'EMP-RECRUIT-0001',
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          dateOfBirth: null,
          gender: null,
          positionId: requisition.positionId,
          orgUnitId: null,
          hireDate: new Date('2026-08-01'),
          employmentType: 'FULL_TIME',
        });
        await employeeRepository.save(newEmployee);
        await historyRepository.append(
          EmploymentHistoryEntry.create({
            tenantId,
            employeeId: newEmployee.id,
            eventType: 'HIRED',
            effectiveDate: newEmployee.hireDate,
            details: `Hired via recruitment application "${loaded.id.toValue()}".`,
          }),
        );
        await onboardingTaskRepository.save(
          OnboardingTask.create({ tenantId, employeeId: newEmployee.id, name: 'IT equipment setup' }),
        );

        await applicationRepository.save(loaded);
        return newEmployee.id;
      }),
    );

    const reloadedApplication = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmApplicationRepository(ctx.manager).findById(application.id)),
    );
    expect(reloadedApplication?.status).toBe('HIRED');

    const reloadedEmployee = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmEmployeeRepository(ctx.manager).findById(employeeId)),
    );
    expect(reloadedEmployee?.employeeNumber).toBe('EMP-RECRUIT-0001');
    expect(reloadedEmployee?.status).toBe('ACTIVE');

    const history = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmEmploymentHistoryRepository(ctx.manager).findByEmployeeId(tenantId, employeeId),
      ),
    );
    expect(history.map((entry) => entry.eventType)).toEqual(['HIRED']);

    const onboardingTasks = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        new TypeOrmOnboardingTaskRepository(ctx.manager).findAllByEmployee(tenantId, employeeId),
      ),
    );
    expect(onboardingTasks).toHaveLength(1);
    expect(onboardingTasks[0].isCompleted).toBe(false);
  });

  it('has an RLS policy on every recruitment & onboarding table', async () => {
    for (const table of ['job_requisition', 'candidate', 'application', 'onboarding_task']) {
      const policies: PolicyRow[] = await ownerDataSource.query(
        `SELECT policyname FROM pg_policies WHERE tablename = $1`,
        [table],
      );
      expect(policies.length).toBeGreaterThan(0);
    }
  });
});
