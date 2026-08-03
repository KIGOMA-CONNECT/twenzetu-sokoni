import { CurrencyCode, Money } from '@abms/kernel';

// Every Money-typed column comes back from Postgres as a string (TypeORM's
// numeric mapping); this is the one place that re-wraps it as a domain
// Money for this module. Mirrors @abms/hr-payroll-infrastructure's
// money-json.mapper, kept as a separate, small copy rather than a shared
// dependency — the same accepted-duplication tradeoff as ADR-0011 point 1.
export function toMoney(amount: string, currency: CurrencyCode): Money {
  return Money.create(amount, currency).getValue();
}
