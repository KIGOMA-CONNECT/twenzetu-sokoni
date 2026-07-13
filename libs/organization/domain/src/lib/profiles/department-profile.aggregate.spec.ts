import { EntityId, TenantId } from '@abms/kernel';
import { DepartmentProfile } from './department-profile.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();

describe('DepartmentProfile.create', () => {
  it('creates a department profile with null optional fields by default', () => {
    const profile = DepartmentProfile.create({ tenantId: TENANT_ID, orgUnitId: ORG_UNIT_ID });

    expect(profile.costCenterOrgUnitId).toBeNull();
    expect(profile.managerReference).toBeNull();
    expect(profile.version).toBe(1);
  });

  it('records a provided cost center link and manager reference', () => {
    const costCenterOrgUnitId = EntityId.create();

    const profile = DepartmentProfile.create({
      tenantId: TENANT_ID,
      orgUnitId: ORG_UNIT_ID,
      costCenterOrgUnitId,
      managerReference: 'user-123',
    });

    expect(profile.costCenterOrgUnitId?.equals(costCenterOrgUnitId)).toBe(true);
    expect(profile.managerReference).toBe('user-123');
  });
});

describe('DepartmentProfile.update', () => {
  it('replaces the cost center link and manager reference', () => {
    const profile = DepartmentProfile.create({ tenantId: TENANT_ID, orgUnitId: ORG_UNIT_ID });
    const newCostCenterOrgUnitId = EntityId.create();

    profile.update({ costCenterOrgUnitId: newCostCenterOrgUnitId, managerReference: 'user-456' });

    expect(profile.costCenterOrgUnitId?.equals(newCostCenterOrgUnitId)).toBe(true);
    expect(profile.managerReference).toBe('user-456');
  });

  it('clears the link when updated with null', () => {
    const profile = DepartmentProfile.create({
      tenantId: TENANT_ID,
      orgUnitId: ORG_UNIT_ID,
      costCenterOrgUnitId: EntityId.create(),
    });

    profile.update({ costCenterOrgUnitId: null });

    expect(profile.costCenterOrgUnitId).toBeNull();
  });
});

describe('DepartmentProfile.reconstitute', () => {
  it('rebuilds a profile from persisted state', () => {
    const id = EntityId.create();

    const profile = DepartmentProfile.reconstitute({
      id,
      tenantId: TENANT_ID,
      orgUnitId: ORG_UNIT_ID,
      costCenterOrgUnitId: null,
      managerReference: null,
      version: 4,
    });

    expect(profile.id.equals(id)).toBe(true);
    expect(profile.version).toBe(4);
  });
});
