import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { Payslip } from './payslip.aggregate';
import { createTanzaniaStatutoryRatesV1 } from './statutory-rates';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const TZS = CurrencyCode.create('TZS').getValue();
const RATES = createTanzaniaStatutoryRatesV1();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

function generatePayslip(basicSalary: string, allowances: { name: string; amount: string }[] = []): Payslip {
  return Payslip.generate({
    tenantId: TENANT_ID,
    employeeId: EntityId.create(),
    payrollPeriodId: EntityId.create(),
    basicSalary: tzs(basicSalary),
    allowances: allowances.map((a) => ({ name: a.name, amount: tzs(a.amount) })),
    statutoryRates: RATES,
  });
}

describe('Payslip', () => {
  it('generate() computes grossPay as basicSalary plus allowances', () => {
    const payslip = generatePayslip('500000', [{ name: 'Transport', amount: '50000' }]);

    expect(payslip.grossPay.amount).toBe('550000.0000');
    expect(payslip.status).toBe('DRAFT');
    expect(payslip.domainEvents).toHaveLength(1);
  });

  it('generate() computes PAYE via PayrollCalculator against the given rates', () => {
    // gross 550000: band2 (520000-270000)*8%=20000; band3 (550000-520000)*20%=6000
    const payslip = generatePayslip('500000', [{ name: 'Transport', amount: '50000' }]);

    expect(payslip.payeAmount.amount).toBe('26000.0000');
  });

  it('generate() computes employee/employer NSSF at the configured rates', () => {
    const payslip = generatePayslip('500000');

    expect(payslip.nssfEmployeeAmount.amount).toBe('50000.0000');
    expect(payslip.nssfEmployerAmount.amount).toBe('50000.0000');
  });

  it('generate() computes netPay as grossPay minus PAYE and employee NSSF only', () => {
    // gross 500000; PAYE = (500000-270000)*8%=18400; nssfEmployee=50000
    // net = 500000 - 18400 - 50000 = 431600
    const payslip = generatePayslip('500000');

    expect(payslip.netPay.amount).toBe('431600.0000');
  });

  it('generate() computes WCF and SDL as employer-only informational costs', () => {
    const payslip = generatePayslip('500000');

    expect(payslip.wcfEmployerAmount.amount).toBe('3000.0000');
    expect(payslip.sdlEmployerAmount.amount).toBe('17500.0000');
  });

  it('approve() transitions DRAFT -> APPROVED and records the approver', () => {
    const payslip = generatePayslip('500000');

    payslip.approve('approver-user-id');

    expect(payslip.status).toBe('APPROVED');
    expect(payslip.approvedByUserId).toBe('approver-user-id');
    expect(payslip.approvedAt).not.toBeNull();
  });

  it('approve() is not idempotent', () => {
    const payslip = generatePayslip('500000');
    payslip.approve('approver-user-id');

    expect(() => payslip.approve('approver-user-id')).toThrow();
  });

  it('markPaid() requires APPROVED status first', () => {
    const payslip = generatePayslip('500000');

    expect(() => payslip.markPaid('payer-user-id')).toThrow();
  });

  it('markPaid() transitions APPROVED -> PAID and records the payer', () => {
    const payslip = generatePayslip('500000');
    payslip.approve('approver-user-id');

    payslip.markPaid('payer-user-id');

    expect(payslip.status).toBe('PAID');
    expect(payslip.paidByUserId).toBe('payer-user-id');
    expect(payslip.paidAt).not.toBeNull();
  });
});
