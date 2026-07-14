import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { WorkflowDefinition } from './workflow-definition.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('WorkflowDefinition.create', () => {
  it('builds sequential steps from the given approver roles, defaults to active, version 1', () => {
    const definition = WorkflowDefinition.create({
      tenantId: TENANT_ID,
      code: 'ORG_UNIT_APPROVAL',
      name: 'Org Unit Approval',
      approverRoles: ['PROJECT_MANAGER', 'CEO'],
    });

    expect(definition.isActive).toBe(true);
    expect(definition.version).toBe(1);
    expect(definition.steps).toEqual([
      { stepOrder: 1, approverRole: 'PROJECT_MANAGER' },
      { stepOrder: 2, approverRole: 'CEO' },
    ]);
  });

  it('rejects an empty code', () => {
    expect(() =>
      WorkflowDefinition.create({ tenantId: TENANT_ID, code: '', name: 'X', approverRoles: ['CEO'] }),
    ).toThrow(BusinessRuleViolationException);
  });

  it('rejects an empty name', () => {
    expect(() =>
      WorkflowDefinition.create({ tenantId: TENANT_ID, code: 'X', name: '', approverRoles: ['CEO'] }),
    ).toThrow(BusinessRuleViolationException);
  });

  it('rejects zero approver roles', () => {
    expect(() =>
      WorkflowDefinition.create({ tenantId: TENANT_ID, code: 'X', name: 'X', approverRoles: [] }),
    ).toThrow(BusinessRuleViolationException);
  });

  it('rejects an empty approver role in the list', () => {
    expect(() =>
      WorkflowDefinition.create({ tenantId: TENANT_ID, code: 'X', name: 'X', approverRoles: ['CEO', ''] }),
    ).toThrow(BusinessRuleViolationException);
  });
});

describe('WorkflowDefinition.reconstitute', () => {
  it('rebuilds a definition from persisted state', () => {
    const id = EntityId.create();

    const definition = WorkflowDefinition.reconstitute({
      id,
      tenantId: TENANT_ID,
      code: 'ORG_UNIT_APPROVAL',
      name: 'Org Unit Approval',
      steps: [{ stepOrder: 1, approverRole: 'CEO' }],
      isActive: false,
      version: 3,
    });

    expect(definition.id.equals(id)).toBe(true);
    expect(definition.isActive).toBe(false);
    expect(definition.version).toBe(3);
    expect(definition.steps).toEqual([{ stepOrder: 1, approverRole: 'CEO' }]);
  });
});
