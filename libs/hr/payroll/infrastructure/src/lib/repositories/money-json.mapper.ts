import { CurrencyCode, Money } from '@abms/kernel';
import { AllowanceLine } from '@abms/hr-payroll-domain';
import { AllowanceLineJson } from '../entities/allowance-line-json';

// Shared amount<->Money and allowances<->jsonb conversion for the three
// Payroll repositories — every Money-typed column comes back from Postgres
// as a string (TypeORM's numeric mapping), so this is the one place that
// re-wraps it as a domain Money instead of duplicating the logic per table.
export function toMoney(amount: string, currency: CurrencyCode): Money {
  return Money.create(amount, currency).getValue();
}

export function toAllowanceLines(json: AllowanceLineJson[], currency: CurrencyCode): AllowanceLine[] {
  return json.map((line) => ({ name: line.name, amount: toMoney(line.amount, currency) }));
}

export function toAllowanceLineJson(allowances: readonly AllowanceLine[]): AllowanceLineJson[] {
  return allowances.map((line) => ({ name: line.name, amount: line.amount.amount }));
}
