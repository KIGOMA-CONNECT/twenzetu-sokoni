import { EntityId, TenantId } from '@abms/kernel';
import { SuccessionPlan } from './succession-plan.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('SuccessionPlan', () => {
  it('opens in OPEN status and emits an event', () => {
    const plan = SuccessionPlan.open({
      tenantId: TENANT_ID,
      positionId: EntityId.create(),
      notes: null,
    });

    expect(plan.status).toBe('OPEN');
    expect(plan.domainEvents).toHaveLength(1);
  });

  it('close() transitions to CLOSED and emits an event', () => {
    const plan = SuccessionPlan.open({
      tenantId: TENANT_ID,
      positionId: EntityId.create(),
      notes: 'Critical leadership role',
    });

    plan.close();

    expect(plan.status).toBe('CLOSED');
    expect(plan.domainEvents).toHaveLength(2);
  });

  it('close() is not idempotent', () => {
    const plan = SuccessionPlan.open({
      tenantId: TENANT_ID,
      positionId: EntityId.create(),
      notes: null,
    });
    plan.close();

    expect(() => plan.close()).toThrow();
  });
});
