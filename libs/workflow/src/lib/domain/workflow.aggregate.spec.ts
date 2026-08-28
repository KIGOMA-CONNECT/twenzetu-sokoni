import { EntityId } from '@afri-market/kernel';
import { Workflow, WorkflowStep } from './workflow.aggregate';

describe('WorkflowStep.define', () => {
  it('creates a step with defaults', () => {
    const step = WorkflowStep.define({
      name: 'Manager Review',
      stepType: 'APPROVAL',
      assigneeRole: 'MANAGER',
      order: 1,
    });

    expect(step.name).toBe('Manager Review');
    expect(step.stepType).toBe('APPROVAL');
    expect(step.assigneeRole).toBe('MANAGER');
    expect(step.order).toBe(1);
    expect(step.isRequired).toBe(true);
    expect(step.timeoutHours).toBeUndefined();
    expect(step.conditions).toEqual({});
  });

  it('accepts optional properties', () => {
    const step = WorkflowStep.define({
      name: 'Finance Approval',
      stepType: 'APPROVAL',
      assigneeRole: 'FINANCE',
      order: 2,
      isRequired: false,
      timeoutHours: 48,
      conditions: { amount: { $gt: 1000000 } },
    });

    expect(step.isRequired).toBe(false);
    expect(step.timeoutHours).toBe(48);
    expect(step.conditions).toEqual({ amount: { $gt: 1000000 } });
  });

  it('rejects empty name', () => {
    expect(() =>
      WorkflowStep.define({ name: '', stepType: 'APPROVAL', assigneeRole: 'R', order: 1 })
    ).toThrow();
  });

  it('rejects empty assigneeRole', () => {
    expect(() =>
      WorkflowStep.define({ name: 'Step', stepType: 'APPROVAL', assigneeRole: '', order: 1 })
    ).toThrow();
  });
});

describe('Workflow.define', () => {
  it('creates a workflow with DRAFT status', () => {
    const workflow = Workflow.define({
      name: 'Vendor Approval',
      entityType: 'Vendor',
      steps: [
        { name: 'Manager Review', stepType: 'APPROVAL', assigneeRole: 'MANAGER', order: 1 },
      ],
    });

    expect(workflow.name).toBe('Vendor Approval');
    expect(workflow.entityType).toBe('Vendor');
    expect(workflow.status).toBe('DRAFT');
    expect(workflow.steps).toHaveLength(1);
    expect(workflow.steps[0].name).toBe('Manager Review');
  });

  it('accepts optional description', () => {
    const workflow = Workflow.define({
      name: 'WF',
      description: 'Test workflow',
      entityType: 'Order',
      steps: [],
    });

    expect(workflow.description).toBe('Test workflow');
  });

  it('rejects empty name', () => {
    expect(() =>
      Workflow.define({ name: '', entityType: 'Order', steps: [] })
    ).toThrow();
  });

  it('rejects empty entityType', () => {
    expect(() =>
      Workflow.define({ name: 'WF', entityType: '', steps: [] })
    ).toThrow();
  });
});

describe('Workflow mutators', () => {
  it('activate(), deactivate(), archive() toggle status', () => {
    const workflow = Workflow.define({
      name: 'WF',
      entityType: 'Order',
      steps: [],
    });

    workflow.activate();
    expect(workflow.status).toBe('ACTIVE');

    workflow.deactivate();
    expect(workflow.status).toBe('INACTIVE');

    workflow.archive();
    expect(workflow.status).toBe('ARCHIVED');
  });

  it('addStep() adds and sorts by order', () => {
    const workflow = Workflow.define({
      name: 'WF',
      entityType: 'Order',
      steps: [{ name: 'B', stepType: 'APPROVAL', assigneeRole: 'R', order: 2 }],
    });

    workflow.addStep(WorkflowStep.define({
      name: 'A',
      stepType: 'APPROVAL',
      assigneeRole: 'R',
      order: 1,
    }));

    expect(workflow.steps).toHaveLength(2);
    expect(workflow.steps[0].name).toBe('A');
    expect(workflow.steps[1].name).toBe('B');
  });

  it('removeStep() removes by name', () => {
    const workflow = Workflow.define({
      name: 'WF',
      entityType: 'Order',
      steps: [
        { name: 'Step1', stepType: 'APPROVAL', assigneeRole: 'R', order: 1 },
        { name: 'Step2', stepType: 'APPROVAL', assigneeRole: 'R', order: 2 },
      ],
    });

    workflow.removeStep('Step1');
    expect(workflow.steps).toHaveLength(1);
    expect(workflow.steps[0].name).toBe('Step2');
  });
});

describe('Workflow.reconstitute', () => {
  it('rebuilds from persisted state', () => {
    const id = EntityId.create();
    const step = WorkflowStep.define({ name: 'S1', stepType: 'APPROVAL', assigneeRole: 'R', order: 1 });
    const workflow = Workflow.reconstitute({
      id,
      name: 'WF',
      entityType: 'Order',
      steps: [step],
      status: 'ACTIVE',
    });

    expect(workflow.id.equals(id)).toBe(true);
    expect(workflow.status).toBe('ACTIVE');
    expect(workflow.steps).toHaveLength(1);
  });
});
