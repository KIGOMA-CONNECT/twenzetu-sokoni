import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { LeaveBalance } from './leave-balance.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function createBalance(allocatedDays = 21) {
  return LeaveBalance.create({
    tenantId: TENANT_ID,
    employeeId: EntityId.create(),
    leaveTypeId: EntityId.create(),
    year: 2026,
    allocatedDays,
  });
}

describe('LeaveBalance.create', () => {
  it('starts with zero usedDays and full remainingDays', () => {
    const balance = createBalance(21);

    expect(balance.usedDays).toBe(0);
    expect(balance.remainingDays).toBe(21);
  });
});

describe('LeaveBalance.debit', () => {
  it('reduces remainingDays', () => {
    const balance = createBalance(21);

    balance.debit(5);

    expect(balance.usedDays).toBe(5);
    expect(balance.remainingDays).toBe(16);
  });

  it('rejects debiting more than the remaining balance', () => {
    const balance = createBalance(5);

    expect(() => balance.debit(6)).toThrow(BusinessRuleViolationException);
  });
});

describe('LeaveBalance.credit', () => {
  it('restores days (e.g. a cancelled request)', () => {
    const balance = createBalance(21);
    balance.debit(5);

    balance.credit(5);

    expect(balance.usedDays).toBe(0);
    expect(balance.remainingDays).toBe(21);
  });
});

describe('LeaveBalance.adjustAllocation', () => {
  it('rejects reducing allocation below what is already used', () => {
    const balance = createBalance(21);
    balance.debit(10);

    expect(() => balance.adjustAllocation(5)).toThrow(BusinessRuleViolationException);
  });

  it('allows increasing allocation', () => {
    const balance = createBalance(21);

    balance.adjustAllocation(25);

    expect(balance.allocatedDays).toBe(25);
  });
});
