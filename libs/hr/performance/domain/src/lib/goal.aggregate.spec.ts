import { EntityId, TenantId } from '@abms/kernel';
import { Goal } from './goal.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function setGoal(): Goal {
  return Goal.set({
    tenantId: TENANT_ID,
    employeeId: EntityId.create(),
    title: 'Ship the Q3 feature',
    description: null,
    targetDate: new Date('2026-09-30'),
  });
}

describe('Goal', () => {
  it('set() starts ACTIVE at 0% progress and emits an event', () => {
    const goal = setGoal();

    expect(goal.status).toBe('ACTIVE');
    expect(goal.progressPercent).toBe(0);
    expect(goal.domainEvents).toHaveLength(1);
  });

  it('rejects an empty title', () => {
    expect(() =>
      Goal.set({
        tenantId: TENANT_ID,
        employeeId: EntityId.create(),
        title: '  ',
        description: null,
        targetDate: new Date('2026-09-30'),
      }),
    ).toThrow();
  });

  it('updateProgress() sets the percentage', () => {
    const goal = setGoal();

    goal.updateProgress(40);

    expect(goal.progressPercent).toBe(40);
  });

  it('updateProgress() rejects a value outside 0-100', () => {
    const goal = setGoal();

    expect(() => goal.updateProgress(150)).toThrow();
  });

  it('complete() sets progress to 100 and status to COMPLETED', () => {
    const goal = setGoal();

    goal.complete();

    expect(goal.status).toBe('COMPLETED');
    expect(goal.progressPercent).toBe(100);
    expect(goal.domainEvents).toHaveLength(2);
  });

  it('cancel() sets status to CANCELLED', () => {
    const goal = setGoal();

    goal.cancel();

    expect(goal.status).toBe('CANCELLED');
  });

  it('rejects further mutation once terminal', () => {
    const goal = setGoal();
    goal.complete();

    expect(() => goal.updateProgress(50)).toThrow();
    expect(() => goal.cancel()).toThrow();
  });
});
