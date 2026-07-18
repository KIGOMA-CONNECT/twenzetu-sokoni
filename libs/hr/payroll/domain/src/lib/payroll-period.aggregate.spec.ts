import { TenantId } from '@abms/kernel';
import { PayrollPeriod } from './payroll-period.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('PayrollPeriod', () => {
  it('opens in OPEN status and emits an event', () => {
    const period = PayrollPeriod.open({ tenantId: TENANT_ID, year: 2026, month: 8 });

    expect(period.status).toBe('OPEN');
    expect(period.domainEvents).toHaveLength(1);
  });

  it('rejects an out-of-range month', () => {
    expect(() => PayrollPeriod.open({ tenantId: TENANT_ID, year: 2026, month: 13 })).toThrow();
  });

  it('close() transitions to CLOSED and emits an event', () => {
    const period = PayrollPeriod.open({ tenantId: TENANT_ID, year: 2026, month: 8 });

    period.close();

    expect(period.status).toBe('CLOSED');
    expect(period.domainEvents).toHaveLength(2);
  });

  it('close() is not idempotent — closing twice throws', () => {
    const period = PayrollPeriod.open({ tenantId: TENANT_ID, year: 2026, month: 8 });
    period.close();

    expect(() => period.close()).toThrow();
  });

  it('assertOpen() throws once closed', () => {
    const period = PayrollPeriod.open({ tenantId: TENANT_ID, year: 2026, month: 8 });
    period.close();

    expect(() => period.assertOpen()).toThrow();
  });

  it('assertOpen() does not throw while OPEN', () => {
    const period = PayrollPeriod.open({ tenantId: TENANT_ID, year: 2026, month: 8 });

    expect(() => period.assertOpen()).not.toThrow();
  });
});
