import { TenantId } from '@abms/kernel';
import { ReviewCycle } from './review-cycle.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function openCycle(): ReviewCycle {
  return ReviewCycle.open({
    tenantId: TENANT_ID,
    name: '2026 H1 Review',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-06-30'),
  });
}

describe('ReviewCycle', () => {
  it('open() starts OPEN and emits an event', () => {
    const cycle = openCycle();

    expect(cycle.status).toBe('OPEN');
    expect(cycle.domainEvents).toHaveLength(1);
  });

  it('rejects startDate after endDate', () => {
    expect(() =>
      ReviewCycle.open({
        tenantId: TENANT_ID,
        name: 'Bad cycle',
        startDate: new Date('2026-06-30'),
        endDate: new Date('2026-01-01'),
      }),
    ).toThrow();
  });

  it('close() transitions to CLOSED and emits an event', () => {
    const cycle = openCycle();

    cycle.close();

    expect(cycle.status).toBe('CLOSED');
    expect(cycle.domainEvents).toHaveLength(2);
  });

  it('close() is not idempotent', () => {
    const cycle = openCycle();
    cycle.close();

    expect(() => cycle.close()).toThrow();
  });

  it('assertOpen() throws once closed', () => {
    const cycle = openCycle();
    cycle.close();

    expect(() => cycle.assertOpen()).toThrow();
  });
});
