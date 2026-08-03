import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { OrgUnit } from './org-unit.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function createOrgUnit(overrides: Partial<{ parentId: EntityId | null }> = {}): OrgUnit {
  return OrgUnit.create({
    tenantId: TENANT_ID,
    orgUnitTypeId: EntityId.create(),
    parentId: overrides.parentId ?? null,
    code: 'HQ',
    name: 'Headquarters',
  });
}

describe('OrgUnit.create', () => {
  it('starts ACTIVE with version 1 and no parent by default', () => {
    const orgUnit = createOrgUnit();

    expect(orgUnit.status).toBe('ACTIVE');
    expect(orgUnit.version).toBe(1);
    expect(orgUnit.parentId).toBeNull();
  });

  it('emits OrgUnitCreatedEvent', () => {
    const orgUnit = createOrgUnit();

    expect(orgUnit.domainEvents).toHaveLength(1);
    expect(orgUnit.domainEvents[0].eventName).toBe('organization.org-unit.created');
  });

  it('rejects an empty code', () => {
    expect(() =>
      OrgUnit.create({
        tenantId: TENANT_ID,
        orgUnitTypeId: EntityId.create(),
        parentId: null,
        code: '',
        name: 'Headquarters',
      }),
    ).toThrow();
  });

  it('rejects an empty name', () => {
    expect(() =>
      OrgUnit.create({
        tenantId: TENANT_ID,
        orgUnitTypeId: EntityId.create(),
        parentId: null,
        code: 'HQ',
        name: '',
      }),
    ).toThrow();
  });
});

describe('OrgUnit.rename', () => {
  it('updates the name and emits OrgUnitRenamedEvent', () => {
    const orgUnit = createOrgUnit();
    orgUnit.clearEvents();

    orgUnit.rename('Head Office');

    expect(orgUnit.name).toBe('Head Office');
    expect(orgUnit.domainEvents).toHaveLength(1);
    expect(orgUnit.domainEvents[0].eventName).toBe('organization.org-unit.renamed');
  });

  it('is a no-op when renaming to the same name', () => {
    const orgUnit = createOrgUnit();
    orgUnit.clearEvents();

    orgUnit.rename('Headquarters');

    expect(orgUnit.domainEvents).toHaveLength(0);
  });

  it('rejects an empty name', () => {
    const orgUnit = createOrgUnit();

    expect(() => orgUnit.rename('')).toThrow(BusinessRuleViolationException);
  });
});

describe('OrgUnit.reparent', () => {
  it('throws BusinessRuleViolationException when the move would create a cycle', () => {
    const orgUnit = createOrgUnit();

    expect(() => orgUnit.reparent(EntityId.create(), true)).toThrow(BusinessRuleViolationException);
  });

  it('does not change parentId when a cyclic move is rejected', () => {
    const orgUnit = createOrgUnit();
    const originalParentId = orgUnit.parentId;

    try {
      orgUnit.reparent(EntityId.create(), true);
    } catch {
      // expected
    }

    expect(orgUnit.parentId).toBe(originalParentId);
  });

  it('updates parentId and emits OrgUnitMovedEvent for a valid move', () => {
    const orgUnit = createOrgUnit();
    orgUnit.clearEvents();
    const newParentId = EntityId.create();

    orgUnit.reparent(newParentId, false);

    expect(orgUnit.parentId?.equals(newParentId)).toBe(true);
    expect(orgUnit.domainEvents).toHaveLength(1);
    expect(orgUnit.domainEvents[0].eventName).toBe('organization.org-unit.moved');
  });

  it('is a no-op when moving to the same parent', () => {
    const parentId = EntityId.create();
    const orgUnit = createOrgUnit({ parentId });
    orgUnit.clearEvents();

    orgUnit.reparent(parentId, false);

    expect(orgUnit.domainEvents).toHaveLength(0);
  });
});

describe('OrgUnit.deactivate / reactivate', () => {
  it('deactivate() flips status and emits OrgUnitDeactivatedEvent', () => {
    const orgUnit = createOrgUnit();
    orgUnit.clearEvents();

    orgUnit.deactivate();

    expect(orgUnit.status).toBe('INACTIVE');
    expect(orgUnit.domainEvents).toHaveLength(1);
    expect(orgUnit.domainEvents[0].eventName).toBe('organization.org-unit.deactivated');
  });

  it('deactivate() is a no-op when already inactive', () => {
    const orgUnit = createOrgUnit();
    orgUnit.deactivate();
    orgUnit.clearEvents();

    orgUnit.deactivate();

    expect(orgUnit.domainEvents).toHaveLength(0);
  });

  it('reactivate() flips status and emits OrgUnitReactivatedEvent', () => {
    const orgUnit = createOrgUnit();
    orgUnit.deactivate();
    orgUnit.clearEvents();

    orgUnit.reactivate();

    expect(orgUnit.status).toBe('ACTIVE');
    expect(orgUnit.domainEvents).toHaveLength(1);
    expect(orgUnit.domainEvents[0].eventName).toBe('organization.org-unit.reactivated');
  });

  it('reactivate() is a no-op when already active', () => {
    const orgUnit = createOrgUnit();
    orgUnit.clearEvents();

    orgUnit.reactivate();

    expect(orgUnit.domainEvents).toHaveLength(0);
  });
});

describe('OrgUnit.reconstitute', () => {
  it('rebuilds an aggregate from persisted state without emitting events', () => {
    const id = EntityId.create();
    const orgUnitTypeId = EntityId.create();

    const orgUnit = OrgUnit.reconstitute({
      id,
      tenantId: TENANT_ID,
      orgUnitTypeId,
      parentId: null,
      code: 'HQ',
      name: 'Headquarters',
      status: 'ACTIVE',
      sortOrder: 5,
      version: 3,
    });

    expect(orgUnit.id.equals(id)).toBe(true);
    expect(orgUnit.orgUnitTypeId.equals(orgUnitTypeId)).toBe(true);
    expect(orgUnit.sortOrder).toBe(5);
    expect(orgUnit.version).toBe(3);
    expect(orgUnit.domainEvents).toHaveLength(0);
  });
});
