export type AccountingPeriod = '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'all_time';

export const ACCOUNTING_PERIODS: ReadonlyArray<AccountingPeriod> = [
  '7d',
  '30d',
  '90d',
  'this_month',
  'last_month',
  'all_time',
];

export type AccountingEntryType =
  | 'ORDER_PAYOUT'
  | 'COMMISSION'
  | 'POS_SALE'
  | 'WALLET_CREDIT'
  | 'WITHDRAWAL'
  | 'WALLET_DEBIT'
  | 'PURCHASE';

export const ACCOUNTING_ENTRY_TYPES: ReadonlyArray<AccountingEntryType> = [
  'ORDER_PAYOUT',
  'COMMISSION',
  'POS_SALE',
  'WALLET_CREDIT',
  'WITHDRAWAL',
  'WALLET_DEBIT',
  'PURCHASE',
];

export interface AccountingEntry {
  id: string;
  date: string;
  type: AccountingEntryType;
  description: string;
  amount: number;
  referenceId?: string;
}

export interface AccountingDateRange {
  since: Date;
  until: Date;
}

function daysAgo(now: Date, days: number): AccountingDateRange {
  return { since: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), until: now };
}

export function resolvePeriodRange(period?: string): AccountingDateRange {
  const now = new Date();
  switch (period) {
    case '7d':
      return daysAgo(now, 7);
    case '90d':
      return daysAgo(now, 90);
    case 'this_month':
      return { since: new Date(now.getFullYear(), now.getMonth(), 1), until: now };
    case 'last_month':
      return {
        since: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        until: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    case 'all_time':
      return { since: new Date(0), until: now };
    case '30d':
    default:
      return daysAgo(now, 30);
  }
}

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function resolveCustomRange(from?: string, to?: string): AccountingDateRange {
  const since = from ? parseLocalDate(from) : new Date(0);
  const untilDate = to ? parseLocalDate(to) : null;
  if (isNaN(since.getTime()) || (untilDate && isNaN(untilDate.getTime()))) {
    throw new Error('Invalid date range, expected YYYY-MM-DD');
  }
  const until = untilDate
    ? new Date(untilDate.getFullYear(), untilDate.getMonth(), untilDate.getDate() + 1)
    : new Date();
  if (until <= since) {
    throw new Error('Invalid date range, to must be after from');
  }
  return { since, until };
}
