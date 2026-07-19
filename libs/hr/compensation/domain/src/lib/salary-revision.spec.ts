import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { SalaryRevision } from './salary-revision';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const TZS = CurrencyCode.create('TZS').getValue();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

describe('SalaryRevision', () => {
  it('records a revision with previous and new basic salary', () => {
    const revision = SalaryRevision.record({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      reason: 'MERIT_INCREASE',
      previousBasicSalary: tzs('500000'),
      newBasicSalary: tzs('550000'),
      effectiveDate: new Date('2026-08-01'),
    });

    expect(revision.reason).toBe('MERIT_INCREASE');
    expect(revision.previousBasicSalary.amount).toBe('500000');
    expect(revision.newBasicSalary.amount).toBe('550000');
  });

  it('rejects a currency mismatch between previous and new basic salary', () => {
    const usd = CurrencyCode.create('USD').getValue();
    expect(() =>
      SalaryRevision.record({
        tenantId: TENANT_ID,
        employeeId: EntityId.create(),
        reason: 'PROMOTION',
        previousBasicSalary: tzs('500000'),
        newBasicSalary: Money.create('600', usd).getValue(),
        effectiveDate: new Date('2026-08-01'),
      }),
    ).toThrow();
  });
});
