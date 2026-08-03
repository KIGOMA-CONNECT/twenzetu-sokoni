import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { SalaryStructure } from './salary-structure.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const TZS = CurrencyCode.create('TZS').getValue();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

describe('SalaryStructure', () => {
  it('creates with basicSalary and no allowances, active by default', () => {
    const structure = SalaryStructure.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      basicSalary: tzs('500000'),
      allowances: [],
      effectiveFrom: new Date('2026-01-01'),
    });

    expect(structure.isActive).toBe(true);
    expect(structure.grossMonthlySalary.amount).toBe('500000');
    expect(structure.domainEvents).toHaveLength(1);
  });

  it('computes grossMonthlySalary as basicSalary plus all allowances', () => {
    const structure = SalaryStructure.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      basicSalary: tzs('500000'),
      allowances: [
        { name: 'Transport', amount: tzs('50000') },
        { name: 'Housing', amount: tzs('100000') },
      ],
      effectiveFrom: new Date('2026-01-01'),
    });

    expect(structure.grossMonthlySalary.amount).toBe('650000.0000');
  });

  it('rejects an allowance in a different currency than basicSalary', () => {
    expect(() =>
      SalaryStructure.create({
        tenantId: TENANT_ID,
        employeeId: EntityId.create(),
        basicSalary: tzs('500000'),
        allowances: [{ name: 'Transport', amount: Money.create('50', CurrencyCode.create('USD').getValue()).getValue() }],
        effectiveFrom: new Date('2026-01-01'),
      }),
    ).toThrow();
  });

  it('rejects an allowance with an empty name', () => {
    expect(() =>
      SalaryStructure.create({
        tenantId: TENANT_ID,
        employeeId: EntityId.create(),
        basicSalary: tzs('500000'),
        allowances: [{ name: '  ', amount: tzs('1000') }],
        effectiveFrom: new Date('2026-01-01'),
      }),
    ).toThrow();
  });

  it('updateBasicSalary replaces the basic salary in the same currency', () => {
    const structure = SalaryStructure.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      basicSalary: tzs('500000'),
      allowances: [],
      effectiveFrom: new Date('2026-01-01'),
    });

    structure.updateBasicSalary(tzs('550000'));

    expect(structure.basicSalary.amount).toBe('550000');
  });

  it('updateBasicSalary rejects a currency change', () => {
    const structure = SalaryStructure.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      basicSalary: tzs('500000'),
      allowances: [],
      effectiveFrom: new Date('2026-01-01'),
    });

    expect(() =>
      structure.updateBasicSalary(Money.create('500', CurrencyCode.create('USD').getValue()).getValue()),
    ).toThrow();
  });

  it('deactivate/activate toggle isActive', () => {
    const structure = SalaryStructure.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      basicSalary: tzs('500000'),
      allowances: [],
      effectiveFrom: new Date('2026-01-01'),
    });

    structure.deactivate();
    expect(structure.isActive).toBe(false);

    structure.activate();
    expect(structure.isActive).toBe(true);
  });
});
