import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { WorkflowInstance } from './workflow-instance.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const STEPS = [
  { stepOrder: 1, approverRole: 'PROJECT_MANAGER' },
  { stepOrder: 2, approverRole: 'CEO' },
];

function startInstance() {
  return WorkflowInstance.start({
    tenantId: TENANT_ID,
    workflowDefinitionId: EntityId.create(),
    subjectType: 'ORG_UNIT',
    subjectId: EntityId.create().toValue(),
    steps: STEPS,
  });
}

describe('WorkflowInstance.start', () => {
  it('initializes all steps as PENDING, status PENDING, version 1', () => {
    const instance = startInstance();

    expect(instance.status).toBe('PENDING');
    expect(instance.version).toBe(1);
    expect(instance.steps).toHaveLength(2);
    expect(instance.steps.every((s) => s.status === 'PENDING')).toBe(true);
  });

  it('rejects zero steps', () => {
    expect(() =>
      WorkflowInstance.start({
        tenantId: TENANT_ID,
        workflowDefinitionId: EntityId.create(),
        subjectType: 'ORG_UNIT',
        subjectId: EntityId.create().toValue(),
        steps: [],
      }),
    ).toThrow(BusinessRuleViolationException);
  });
});

describe('WorkflowInstance.approveStep', () => {
  it('approves the current step and advances, staying PENDING while steps remain', () => {
    const instance = startInstance();

    instance.approveStep(1, 'user-pm', 'PROJECT_MANAGER', 'looks good');

    expect(instance.status).toBe('PENDING');
    expect(instance.version).toBe(2);
    const step1 = instance.steps.find((s) => s.stepOrder === 1);
    expect(step1?.status).toBe('APPROVED');
    expect(step1?.decidedByUserId).toBe('user-pm');
    expect(step1?.comment).toBe('looks good');
  });

  it('completes the instance (status APPROVED) once the final step is approved', () => {
    const instance = startInstance();

    instance.approveStep(1, 'user-pm', 'PROJECT_MANAGER', null);
    instance.approveStep(2, 'user-ceo', 'CEO', null);

    expect(instance.status).toBe('APPROVED');
  });

  it('rejects approving a step out of sequence', () => {
    const instance = startInstance();

    expect(() => instance.approveStep(2, 'user-ceo', 'CEO', null)).toThrow(BusinessRuleViolationException);
  });

  it('rejects approving with the wrong role for the current step', () => {
    const instance = startInstance();

    expect(() => instance.approveStep(1, 'user-ceo', 'CEO', null)).toThrow(BusinessRuleViolationException);
  });

  it('rejects approving once the instance is already APPROVED', () => {
    const instance = startInstance();
    instance.approveStep(1, 'user-pm', 'PROJECT_MANAGER', null);
    instance.approveStep(2, 'user-ceo', 'CEO', null);

    expect(() => instance.approveStep(1, 'user-pm', 'PROJECT_MANAGER', null)).toThrow(
      BusinessRuleViolationException,
    );
  });
});

describe('WorkflowInstance.rejectStep', () => {
  it('rejects the current step and ends the whole instance as REJECTED', () => {
    const instance = startInstance();

    instance.rejectStep(1, 'user-pm', 'PROJECT_MANAGER', 'not viable');

    expect(instance.status).toBe('REJECTED');
    const step1 = instance.steps.find((s) => s.stepOrder === 1);
    expect(step1?.status).toBe('REJECTED');
    expect(step1?.comment).toBe('not viable');
    // Step 2 never got evaluated.
    const step2 = instance.steps.find((s) => s.stepOrder === 2);
    expect(step2?.status).toBe('PENDING');
  });

  it('rejects deciding once the instance is already REJECTED', () => {
    const instance = startInstance();
    instance.rejectStep(1, 'user-pm', 'PROJECT_MANAGER', null);

    expect(() => instance.rejectStep(1, 'user-pm', 'PROJECT_MANAGER', null)).toThrow(
      BusinessRuleViolationException,
    );
  });
});

describe('WorkflowInstance.reconstitute', () => {
  it('rebuilds an instance from persisted state', () => {
    const id = EntityId.create();
    const workflowDefinitionId = EntityId.create();

    const instance = WorkflowInstance.reconstitute({
      id,
      tenantId: TENANT_ID,
      workflowDefinitionId,
      subjectType: 'ORG_UNIT',
      subjectId: 'org-unit-1',
      status: 'APPROVED',
      steps: [
        {
          stepOrder: 1,
          approverRole: 'CEO',
          status: 'APPROVED',
          decidedByUserId: 'user-ceo',
          decidedAt: new Date('2026-01-01'),
          comment: null,
        },
      ],
      version: 2,
    });

    expect(instance.id.equals(id)).toBe(true);
    expect(instance.workflowDefinitionId.equals(workflowDefinitionId)).toBe(true);
    expect(instance.status).toBe('APPROVED');
    expect(instance.version).toBe(2);
  });
});
