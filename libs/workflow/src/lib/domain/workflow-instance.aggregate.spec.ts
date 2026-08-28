import { EntityId } from '@afri-market/kernel';
import { WorkflowInstance } from './workflow-instance.aggregate';

describe('WorkflowInstance.initiate', () => {
  it('creates an instance with IN_PROGRESS status', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Vendor',
      entityId: 'vendor-1',
      tenantId: 'tenant-1',
      initiatedBy: 'user-1',
    });

    expect(instance.workflowId).toBe('wf-1');
    expect(instance.entityType).toBe('Vendor');
    expect(instance.entityId).toBe('vendor-1');
    expect(instance.tenantId).toBe('tenant-1');
    expect(instance.initiatedBy).toBe('user-1');
    expect(instance.status).toBe('IN_PROGRESS');
    expect(instance.currentStepIndex).toBe(0);
    expect(instance.actions).toEqual([]);
    expect(instance.data).toEqual({});
  });

  it('accepts optional data', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Order',
      entityId: 'order-1',
      tenantId: 'tenant-1',
      initiatedBy: 'user-1',
      data: { amount: 500000, currency: 'TZS' },
    });

    expect(instance.data).toEqual({ amount: 500000, currency: 'TZS' });
  });

  it('rejects empty workflowId', () => {
    expect(() =>
      WorkflowInstance.initiate({
        workflowId: '',
        entityType: 'Order',
        entityId: 'e',
        tenantId: 't',
        initiatedBy: 'u',
      })
    ).toThrow();
  });

  it('rejects empty entityId', () => {
    expect(() =>
      WorkflowInstance.initiate({
        workflowId: 'wf-1',
        entityType: 'Order',
        entityId: '',
        tenantId: 't',
        initiatedBy: 'u',
      })
    ).toThrow();
  });

  it('rejects empty tenantId', () => {
    expect(() =>
      WorkflowInstance.initiate({
        workflowId: 'wf-1',
        entityType: 'Order',
        entityId: 'e',
        tenantId: '',
        initiatedBy: 'u',
      })
    ).toThrow();
  });

  it('rejects empty initiatedBy', () => {
    expect(() =>
      WorkflowInstance.initiate({
        workflowId: 'wf-1',
        entityType: 'Order',
        entityId: 'e',
        tenantId: 't',
        initiatedBy: '',
      })
    ).toThrow();
  });
});

describe('WorkflowInstance approve/reject', () => {
  it('approveStep() adds an action and increments step index', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Order',
      entityId: 'e',
      tenantId: 't',
      initiatedBy: 'u',
    });

    instance.approveStep('Manager Review', 'user-2', 'Looks good');

    expect(instance.actions).toHaveLength(1);
    expect(instance.actions[0].stepName).toBe('Manager Review');
    expect(instance.actions[0].action).toBe('APPROVE');
    expect(instance.actions[0].performedBy).toBe('user-2');
    expect(instance.actions[0].comment).toBe('Looks good');
    expect(instance.currentStepIndex).toBe(1);
    expect(instance.status).toBe('IN_PROGRESS');
  });

  it('rejectStep() adds an action and sets REJECTED status', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Order',
      entityId: 'e',
      tenantId: 't',
      initiatedBy: 'u',
    });

    instance.rejectStep('Manager Review', 'user-2', 'Rejected');

    expect(instance.actions).toHaveLength(1);
    expect(instance.actions[0].action).toBe('REJECT');
    expect(instance.status).toBe('REJECTED');
  });

  it('approveStep() throws if workflow is not IN_PROGRESS', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Order',
      entityId: 'e',
      tenantId: 't',
      initiatedBy: 'u',
    });

    instance.cancel();

    expect(() => instance.approveStep('Step', 'user')).toThrow('Workflow is not in progress');
  });

  it('rejectStep() throws if workflow is not IN_PROGRESS', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Order',
      entityId: 'e',
      tenantId: 't',
      initiatedBy: 'u',
    });

    instance.cancel();

    expect(() => instance.rejectStep('Step', 'user')).toThrow('Workflow is not in progress');
  });
});

describe('WorkflowInstance lifecycle', () => {
  it('complete() sets status to COMPLETED', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Order',
      entityId: 'e',
      tenantId: 't',
      initiatedBy: 'u',
    });

    instance.complete();
    expect(instance.status).toBe('COMPLETED');
  });

  it('cancel() sets status to CANCELLED', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Order',
      entityId: 'e',
      tenantId: 't',
      initiatedBy: 'u',
    });

    instance.cancel();
    expect(instance.status).toBe('CANCELLED');
  });

  it('expire() sets status to EXPIRED', () => {
    const instance = WorkflowInstance.initiate({
      workflowId: 'wf-1',
      entityType: 'Order',
      entityId: 'e',
      tenantId: 't',
      initiatedBy: 'u',
    });

    instance.expire();
    expect(instance.status).toBe('EXPIRED');
  });
});
