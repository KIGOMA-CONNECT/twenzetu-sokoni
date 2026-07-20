import { EntityId, TenantId } from '@abms/kernel';
import { SuccessionCandidate } from './succession-candidate.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('SuccessionCandidate', () => {
  it('nominates with a readiness level and emits an event', () => {
    const candidate = SuccessionCandidate.nominate({
      tenantId: TENANT_ID,
      successionPlanId: EntityId.create(),
      employeeId: EntityId.create(),
      readinessLevel: 'READY_1_2_YEARS',
      notes: null,
    });

    expect(candidate.readinessLevel).toBe('READY_1_2_YEARS');
    expect(candidate.domainEvents).toHaveLength(1);
  });

  it('updateReadiness() changes the level and emits an event', () => {
    const candidate = SuccessionCandidate.nominate({
      tenantId: TENANT_ID,
      successionPlanId: EntityId.create(),
      employeeId: EntityId.create(),
      readinessLevel: 'NOT_READY',
      notes: null,
    });

    candidate.updateReadiness('READY_NOW', 'Promoted after strong Q3 performance');

    expect(candidate.readinessLevel).toBe('READY_NOW');
    expect(candidate.notes).toBe('Promoted after strong Q3 performance');
    expect(candidate.domainEvents).toHaveLength(2);
  });
});
