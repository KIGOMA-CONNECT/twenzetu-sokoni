import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { OrgUnitType } from './org-unit-type.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('OrgUnitType.create', () => {
  it('defaults to active, not system-defined, sortOrder 0, and no allowed parents', () => {
    const type = OrgUnitType.create({ tenantId: TENANT_ID, code: 'DEPARTMENT', name: 'Department' });

    expect(type.isActive).toBe(true);
    expect(type.isSystemDefined).toBe(false);
    expect(type.sortOrder).toBe(0);
    expect(type.allowedParentTypeIds).toHaveLength(0);
    expect(type.isRootType()).toBe(true);
  });

  it('rejects an empty code', () => {
    expect(() => OrgUnitType.create({ tenantId: TENANT_ID, code: '', name: 'Department' })).toThrow(
      BusinessRuleViolationException,
    );
  });

  it('rejects an empty name', () => {
    expect(() => OrgUnitType.create({ tenantId: TENANT_ID, code: 'DEPARTMENT', name: '' })).toThrow(
      BusinessRuleViolationException,
    );
  });

  it('records the given allowed parent type ids', () => {
    const companyTypeId = EntityId.create();
    const divisionTypeId = EntityId.create();

    const type = OrgUnitType.create({
      tenantId: TENANT_ID,
      code: 'DEPARTMENT',
      name: 'Department',
      allowedParentTypeIds: [companyTypeId, divisionTypeId],
    });

    expect(type.isRootType()).toBe(false);
    expect(type.allowsParentType(companyTypeId)).toBe(true);
    expect(type.allowsParentType(divisionTypeId)).toBe(true);
    expect(type.allowsParentType(EntityId.create())).toBe(false);
  });
});

describe('OrgUnitType mutators', () => {
  it('rename() updates the name', () => {
    const type = OrgUnitType.create({ tenantId: TENANT_ID, code: 'DEPARTMENT', name: 'Department' });

    type.rename('Business Department');

    expect(type.name).toBe('Business Department');
  });

  it('rename() rejects an empty name', () => {
    const type = OrgUnitType.create({ tenantId: TENANT_ID, code: 'DEPARTMENT', name: 'Department' });

    expect(() => type.rename('')).toThrow(BusinessRuleViolationException);
  });

  it('updateDescription() replaces the description', () => {
    const type = OrgUnitType.create({ tenantId: TENANT_ID, code: 'DEPARTMENT', name: 'Department' });

    type.updateDescription('A functional grouping of teams.');

    expect(type.description).toBe('A functional grouping of teams.');
  });

  it('deactivate()/activate() toggle isActive', () => {
    const type = OrgUnitType.create({ tenantId: TENANT_ID, code: 'DEPARTMENT', name: 'Department' });

    type.deactivate();
    expect(type.isActive).toBe(false);

    type.activate();
    expect(type.isActive).toBe(true);
  });
});

describe('OrgUnitType.reconstitute', () => {
  it('rebuilds a type from persisted state', () => {
    const id = EntityId.create();
    const allowedParentTypeId = EntityId.create();

    const type = OrgUnitType.reconstitute({
      id,
      tenantId: TENANT_ID,
      code: 'DEPARTMENT',
      name: 'Department',
      description: 'desc',
      isSystemDefined: true,
      isActive: false,
      sortOrder: 7,
      allowedParentTypeIds: [allowedParentTypeId],
    });

    expect(type.id.equals(id)).toBe(true);
    expect(type.isSystemDefined).toBe(true);
    expect(type.isActive).toBe(false);
    expect(type.sortOrder).toBe(7);
    expect(type.allowsParentType(allowedParentTypeId)).toBe(true);
  });
});
