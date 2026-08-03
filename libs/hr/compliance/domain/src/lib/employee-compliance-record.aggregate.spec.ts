import { EntityId, TenantId } from '@abms/kernel';
import { EmployeeComplianceRecord } from './employee-compliance-record.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function assign(): EmployeeComplianceRecord {
  return EmployeeComplianceRecord.assign({
    tenantId: TENANT_ID,
    employeeId: EntityId.create(),
    complianceRequirementId: EntityId.create(),
    dueDate: new Date('2026-12-31'),
  });
}

describe('EmployeeComplianceRecord', () => {
  it('assigns in PENDING status and emits an event', () => {
    const record = assign();

    expect(record.status).toBe('PENDING');
    expect(record.domainEvents).toHaveLength(1);
  });

  it('markCompliant() transitions to COMPLIANT and records the completed date', () => {
    const record = assign();

    record.markCompliant(new Date('2026-11-01'));

    expect(record.status).toBe('COMPLIANT');
    expect(record.completedDate).toEqual(new Date('2026-11-01'));
    expect(record.domainEvents).toHaveLength(2);
  });

  it('markOverdue() transitions to OVERDUE', () => {
    const record = assign();

    record.markOverdue();

    expect(record.status).toBe('OVERDUE');
    expect(record.domainEvents).toHaveLength(2);
  });

  it('markExempt() transitions to EXEMPT and records the reason', () => {
    const record = assign();

    record.markExempt('Contractor, not subject to this requirement');

    expect(record.status).toBe('EXEMPT');
    expect(record.exemptionReason).toBe('Contractor, not subject to this requirement');
    expect(record.domainEvents).toHaveLength(2);
  });

  it('rejects a second transition once terminal', () => {
    const record = assign();
    record.markCompliant(new Date('2026-11-01'));

    expect(() => record.markOverdue()).toThrow();
  });
});
