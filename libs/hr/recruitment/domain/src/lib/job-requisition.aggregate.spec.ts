import { EntityId, TenantId } from '@abms/kernel';
import { JobRequisition } from './job-requisition.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('JobRequisition', () => {
  it('opens in OPEN status and emits an event', () => {
    const requisition = JobRequisition.open({
      tenantId: TENANT_ID,
      positionId: EntityId.create(),
      title: 'Software Engineer',
      headcount: 2,
    });

    expect(requisition.status).toBe('OPEN');
    expect(requisition.domainEvents).toHaveLength(1);
  });

  it('rejects a headcount of zero', () => {
    expect(() =>
      JobRequisition.open({
        tenantId: TENANT_ID,
        positionId: EntityId.create(),
        title: 'Software Engineer',
        headcount: 0,
      }),
    ).toThrow();
  });

  it('rejects an empty title', () => {
    expect(() =>
      JobRequisition.open({
        tenantId: TENANT_ID,
        positionId: EntityId.create(),
        title: '  ',
        headcount: 1,
      }),
    ).toThrow();
  });

  it('close() records the reason and emits an event', () => {
    const requisition = JobRequisition.open({
      tenantId: TENANT_ID,
      positionId: EntityId.create(),
      title: 'Software Engineer',
      headcount: 1,
    });

    requisition.close('FILLED');

    expect(requisition.status).toBe('CLOSED');
    expect(requisition.closeReason).toBe('FILLED');
    expect(requisition.domainEvents).toHaveLength(2);
  });

  it('close() is not idempotent', () => {
    const requisition = JobRequisition.open({
      tenantId: TENANT_ID,
      positionId: EntityId.create(),
      title: 'Software Engineer',
      headcount: 1,
    });
    requisition.close('CANCELLED');

    expect(() => requisition.close('FILLED')).toThrow();
  });
});
