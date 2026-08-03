import { EntityId, TenantId } from '@abms/kernel';
import { OnboardingTask } from './onboarding-task.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('OnboardingTask', () => {
  it('creates as incomplete', () => {
    const task = OnboardingTask.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      name: 'Collect signed contract',
    });

    expect(task.isCompleted).toBe(false);
    expect(task.completedAt).toBeNull();
  });

  it('rejects an empty name', () => {
    expect(() =>
      OnboardingTask.create({ tenantId: TENANT_ID, employeeId: EntityId.create(), name: '  ' }),
    ).toThrow();
  });

  it('complete() marks it done and records a timestamp', () => {
    const task = OnboardingTask.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      name: 'IT equipment setup',
    });

    task.complete();

    expect(task.isCompleted).toBe(true);
    expect(task.completedAt).not.toBeNull();
  });

  it('complete() is not idempotent', () => {
    const task = OnboardingTask.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      name: 'Orientation',
    });
    task.complete();

    expect(() => task.complete()).toThrow();
  });
});
