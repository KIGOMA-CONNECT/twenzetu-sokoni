import { TenantId } from '@abms/kernel';
import { ComplianceRequirement } from './compliance-requirement.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('ComplianceRequirement', () => {
  it('creates in an active state and emits an event', () => {
    const requirement = ComplianceRequirement.create({
      tenantId: TENANT_ID,
      name: 'Annual Fire Safety Certification',
      description: null,
      category: 'SAFETY',
      recurrence: 'ANNUAL',
    });

    expect(requirement.isActive).toBe(true);
    expect(requirement.domainEvents).toHaveLength(1);
  });

  it('deactivate() transitions to inactive and emits an event', () => {
    const requirement = ComplianceRequirement.create({
      tenantId: TENANT_ID,
      name: 'Annual Fire Safety Certification',
      description: null,
      category: 'SAFETY',
      recurrence: 'ANNUAL',
    });

    requirement.deactivate();

    expect(requirement.isActive).toBe(false);
    expect(requirement.domainEvents).toHaveLength(2);
  });

  it('deactivate() is not idempotent', () => {
    const requirement = ComplianceRequirement.create({
      tenantId: TENANT_ID,
      name: 'Annual Fire Safety Certification',
      description: null,
      category: 'SAFETY',
      recurrence: 'ANNUAL',
    });
    requirement.deactivate();

    expect(() => requirement.deactivate()).toThrow();
  });

  it('assertActive() throws once deactivated', () => {
    const requirement = ComplianceRequirement.create({
      tenantId: TENANT_ID,
      name: 'Annual Fire Safety Certification',
      description: null,
      category: 'SAFETY',
      recurrence: 'ANNUAL',
    });
    requirement.deactivate();

    expect(() => requirement.assertActive('assign to an employee')).toThrow();
  });
});
