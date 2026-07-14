import { EntityId, TenantId } from '@abms/kernel';
import { EmploymentHistoryEntry } from './employment-history-entry';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('EmploymentHistoryEntry.create', () => {
  it('builds an entry with the given fields', () => {
    const employeeId = EntityId.create();

    const entry = EmploymentHistoryEntry.create({
      tenantId: TENANT_ID,
      employeeId,
      eventType: 'HIRED',
      effectiveDate: new Date('2026-01-01'),
      details: 'Hired as Software Engineer.',
    });

    expect(entry.employeeId.equals(employeeId)).toBe(true);
    expect(entry.eventType).toBe('HIRED');
    expect(entry.details).toBe('Hired as Software Engineer.');
  });
});

describe('EmploymentHistoryEntry.reconstitute', () => {
  it('rebuilds an entry from persisted state', () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();

    const entry = EmploymentHistoryEntry.reconstitute({
      id,
      tenantId: TENANT_ID,
      employeeId,
      eventType: 'TERMINATED',
      effectiveDate: new Date('2026-06-01'),
      details: null,
    });

    expect(entry.id.equals(id)).toBe(true);
    expect(entry.eventType).toBe('TERMINATED');
  });
});
