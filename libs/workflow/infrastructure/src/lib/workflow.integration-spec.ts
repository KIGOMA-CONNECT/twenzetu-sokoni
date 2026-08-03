import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { TenantId } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { WorkflowDefinition, WorkflowInstance } from '@abms/workflow-domain';
import { DataSource } from 'typeorm';
import { WORKFLOW_ENTITIES } from './workflow-entities';
import { TypeOrmWorkflowDefinitionRepository } from './repositories/typeorm-workflow-definition.repository';
import { TypeOrmWorkflowInstanceRepository } from './repositories/typeorm-workflow-instance.repository';

const TEST_TENANT_ID = '44444444-4444-4444-8444-444444444444';

interface PolicyRow {
  policyname: string;
}

describe('Workflow tables correctness (integration)', () => {
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
      entities: WORKFLOW_ENTITIES,
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    // FORCE ROW LEVEL SECURITY applies to the owner role too — the tenant GUC
    // must be set within the same transaction before these DELETEs.
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "workflow_instance" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "workflow_definition" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('runs a full sequential approval chain end to end: define -> start -> approve x2 -> APPROVED', async () => {
    const definition = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmWorkflowDefinitionRepository(ctx.manager);
        const newDefinition = WorkflowDefinition.create({
          tenantId,
          code: 'ORG_UNIT_APPROVAL',
          name: 'Org Unit Approval',
          approverRoles: ['PROJECT_MANAGER', 'CEO'],
        });
        await repository.save(newDefinition);
        return newDefinition;
      }),
    );

    expect(definition.steps).toEqual([
      { stepOrder: 1, approverRole: 'PROJECT_MANAGER' },
      { stepOrder: 2, approverRole: 'CEO' },
    ]);

    const instance = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmWorkflowInstanceRepository(ctx.manager);
        const newInstance = WorkflowInstance.start({
          tenantId,
          workflowDefinitionId: definition.id,
          subjectType: 'ORG_UNIT',
          subjectId: 'org-unit-integration-test',
          steps: definition.steps,
        });
        await repository.save(newInstance);
        return newInstance;
      }),
    );

    expect(instance.status).toBe('PENDING');

    // Step 1: wrong role is rejected, and does not corrupt persisted state.
    await expect(
      tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction(async (ctx) => {
          const repository = new TypeOrmWorkflowInstanceRepository(ctx.manager);
          const loaded = await repository.findById(instance.id);
          loaded?.approveStep(1, 'user-wrong-role', 'CEO', null);
          if (loaded) {
            await repository.save(loaded);
          }
        }),
      ),
    ).rejects.toThrow();

    const afterWrongRole = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmWorkflowInstanceRepository(ctx.manager).findById(instance.id)),
    );
    expect(afterWrongRole?.status).toBe('PENDING');
    expect(afterWrongRole?.steps.find((s) => s.stepOrder === 1)?.status).toBe('PENDING');

    // Step 1: correct role approves.
    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmWorkflowInstanceRepository(ctx.manager);
        const loaded = await repository.findById(instance.id);
        loaded?.approveStep(1, 'user-pm', 'PROJECT_MANAGER', 'looks good');
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const afterStep1 = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmWorkflowInstanceRepository(ctx.manager).findById(instance.id)),
    );
    expect(afterStep1?.status).toBe('PENDING');
    expect(afterStep1?.steps.find((s) => s.stepOrder === 1)?.status).toBe('APPROVED');
    expect(afterStep1?.steps.find((s) => s.stepOrder === 1)?.decidedByUserId).toBe('user-pm');

    // Step 2: final approval completes the whole instance.
    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmWorkflowInstanceRepository(ctx.manager);
        const loaded = await repository.findById(instance.id);
        loaded?.approveStep(2, 'user-ceo', 'CEO', null);
        if (loaded) {
          await repository.save(loaded);
        }
      }),
    );

    const final = await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) => new TypeOrmWorkflowInstanceRepository(ctx.manager).findById(instance.id)),
    );
    expect(final?.status).toBe('APPROVED');
    expect(final?.steps.every((s) => s.status === 'APPROVED')).toBe(true);
  });

  it('has an RLS policy on both workflow tables', async () => {
    const definitionPolicies: PolicyRow[] = await ownerDataSource.query(
      `SELECT policyname FROM pg_policies WHERE tablename = 'workflow_definition'`,
    );
    const instancePolicies: PolicyRow[] = await ownerDataSource.query(
      `SELECT policyname FROM pg_policies WHERE tablename = 'workflow_instance'`,
    );

    expect(definitionPolicies.length).toBeGreaterThan(0);
    expect(instancePolicies.length).toBeGreaterThan(0);
  });
});
