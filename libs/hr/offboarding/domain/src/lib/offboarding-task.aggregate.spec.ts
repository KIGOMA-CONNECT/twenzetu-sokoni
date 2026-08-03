import { EntityId, TenantId } from '@abms/kernel';
import { OffboardingTask } from './offboarding-task.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('OffboardingTask', () => {
  it('creates as incomplete', () => {
    const task = OffboardingTask.create({
      tenantId: TENANT_ID,
      offboardingCaseId: EntityId.create(),
      employeeId: EntityId.create(),
      name: 'Return company equipment',
    });

    expect(task.isCompleted).toBe(false);
    expect(task.completedAt).toBeNull();
  });

  it('rejects an empty name', () => {
    expect(() =>
      OffboardingTask.create({
        tenantId: TENANT_ID,
        offboardingCaseId: EntityId.create(),
        employeeId: EntityId.create(),
        name: '  ',
      }),
    ).toThrow();
  });

  it('complete() marks it done and records a timestamp', () => {
    const task = OffboardingTask.create({
      tenantId: TENANT_ID,
      offboardingCaseId: EntityId.create(),
      employeeId: EntityId.create(),
      name: 'Revoke system access',
    });

    task.complete();

    expect(task.isCompleted).toBe(true);
    expect(task.completedAt).not.toBeNull();
  });

  it('complete() is not idempotent', () => {
    const task = OffboardingTask.create({
      tenantId: TENANT_ID,
      offboardingCaseId: EntityId.create(),
      employeeId: EntityId.create(),
      name: 'Exit interview',
    });
    task.complete();

    expect(() => task.complete()).toThrow();
  });
});
