import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { LeaveType } from './leave-type.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('LeaveType.create', () => {
  it('defaults to active with the given fields', () => {
    const leaveType = LeaveType.create({
      tenantId: TENANT_ID,
      code: 'ANNUAL',
      name: 'Annual Leave',
      defaultDaysPerYear: 21,
      requiresApproval: true,
    });

    expect(leaveType.isActive).toBe(true);
    expect(leaveType.defaultDaysPerYear).toBe(21);
    expect(leaveType.requiresApproval).toBe(true);
  });

  it('rejects an empty code', () => {
    expect(() =>
      LeaveType.create({
        tenantId: TENANT_ID,
        code: '',
        name: 'Annual Leave',
        defaultDaysPerYear: 21,
        requiresApproval: true,
      }),
    ).toThrow(BusinessRuleViolationException);
  });

  it('rejects a negative defaultDaysPerYear', () => {
    expect(() =>
      LeaveType.create({
        tenantId: TENANT_ID,
        code: 'ANNUAL',
        name: 'Annual Leave',
        defaultDaysPerYear: -1,
        requiresApproval: true,
      }),
    ).toThrow(BusinessRuleViolationException);
  });
});

describe('LeaveType mutators', () => {
  it('rename() updates the name', () => {
    const leaveType = LeaveType.create({
      tenantId: TENANT_ID,
      code: 'ANNUAL',
      name: 'Annual Leave',
      defaultDaysPerYear: 21,
      requiresApproval: true,
    });

    leaveType.rename('Vacation Leave');

    expect(leaveType.name).toBe('Vacation Leave');
  });

  it('deactivate()/activate() toggle isActive', () => {
    const leaveType = LeaveType.create({
      tenantId: TENANT_ID,
      code: 'ANNUAL',
      name: 'Annual Leave',
      defaultDaysPerYear: 21,
      requiresApproval: true,
    });

    leaveType.deactivate();
    expect(leaveType.isActive).toBe(false);

    leaveType.activate();
    expect(leaveType.isActive).toBe(true);
  });
});

describe('LeaveType.reconstitute', () => {
  it('rebuilds a leave type from persisted state', () => {
    const id = EntityId.create();

    const leaveType = LeaveType.reconstitute({
      id,
      tenantId: TENANT_ID,
      code: 'SICK',
      name: 'Sick Leave',
      defaultDaysPerYear: 14,
      requiresApproval: false,
      isActive: false,
    });

    expect(leaveType.id.equals(id)).toBe(true);
    expect(leaveType.isActive).toBe(false);
    expect(leaveType.requiresApproval).toBe(false);
  });
});
