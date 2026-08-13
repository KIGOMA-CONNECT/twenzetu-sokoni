import {
  BalanceSheetAccountOrmEntity,
  PaymentOrmEntity,
  ProductOrmEntity,
  ProductSaleOrmEntity,
  WalletTransactionOrmEntity,
  PurchaseOrderOrmEntity,
  WalletOrmEntity,
} from '@afri-market/marketplace-infrastructure';
import { VendorAccountingService } from '../lib/use-cases/vendor-accounting/vendor-accounting.service';
import {
  resolveCustomRange,
  resolvePeriodRange,
  ACCOUNTING_PERIODS,
  ACCOUNTING_ENTRY_TYPES,
} from '../lib/use-cases/vendor-accounting/vendor-accounting-range';

const TENANT_ID = 'tenant-1';
const VENDOR_ID = 'vendor-1';

function range() {
  return resolvePeriodRange('30d');
}

function makeQueryBuilder(opts: { one?: unknown; many?: unknown[] }) {
  const qb: any = {
    _runOne: opts.one,
    _runMany: opts.many,
    select: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    getRawOne: jest.fn(() => Promise.resolve(opts.one)),
    getRawMany: jest.fn(() => Promise.resolve(opts.many ?? [])),
  };
  qb.select.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  return qb;
}

const emptyOne = {
  gross: '0',
  commission: '0',
  net: '0',
  count: '0',
  pos: '0',
  posCount: '0',
  credits: '0',
  withdrawals: '0',
  otherDebits: '0',
  cogs: '0',
  poCount: '0',
};

function makeDataSource(opts: {
  paymentOne?: unknown;
  saleOne?: unknown;
  walletOne?: unknown;
  poOne?: unknown;
  paymentRows?: unknown[];
  saleRows?: unknown[];
  walletRows?: unknown[];
  poRows?: unknown[];
  wallet?: unknown;
  productOne?: unknown;
  balanceSheetAccounts?: unknown[];
  loanOutstanding?: string;
}) {
  const dataSource: any = {
    query: jest.fn(() =>
      Promise.resolve([{ outstanding: opts.loanOutstanding ?? '0' }]),
    ),
    getRepository: jest.fn((entity: any) => {
      if (entity === PaymentOrmEntity) {
        return { createQueryBuilder: jest.fn(() => makeQueryBuilder({ one: opts.paymentOne ?? emptyOne, many: opts.paymentRows })) };
      }
      if (entity === ProductSaleOrmEntity) {
        return { createQueryBuilder: jest.fn(() => makeQueryBuilder({ one: opts.saleOne ?? emptyOne, many: opts.saleRows })) };
      }
      if (entity === WalletTransactionOrmEntity) {
        return { createQueryBuilder: jest.fn(() => makeQueryBuilder({ one: opts.walletOne ?? emptyOne, many: opts.walletRows })) };
      }
      if (entity === PurchaseOrderOrmEntity) {
        return { createQueryBuilder: jest.fn(() => makeQueryBuilder({ one: opts.poOne ?? emptyOne, many: opts.poRows })) };
      }
      if (entity === WalletOrmEntity) {
        return { findOne: jest.fn(() => Promise.resolve(opts.wallet ?? null)) };
      }
      if (entity === ProductOrmEntity) {
        return { createQueryBuilder: jest.fn(() => makeQueryBuilder({ one: opts.productOne ?? { inventory: '0' } })) };
      }
      if (entity === BalanceSheetAccountOrmEntity) {
        return { find: jest.fn(() => Promise.resolve(opts.balanceSheetAccounts ?? [])) };
      }
      throw new Error(`Unexpected entity ${String((entity as any)?.name)}`);
    }),
  };
  return dataSource;
}

describe('VendorAccountingService.summary', () => {
  it('should aggregate income, commission, purchases and wallet flows', async () => {
    const service = new VendorAccountingService(
      makeDataSource({
        paymentOne: { gross: '100000', commission: '10000', net: '90000', count: '3' },
        saleOne: { pos: '50000', posCount: '4' },
        walletOne: { credits: '20000', withdrawals: '15000', otherDebits: '5000' },
        poOne: { cogs: '30000', poCount: '2' },
      }),
    );

    const s = await service.summary(TENANT_ID, VENDOR_ID, range());

    expect(s.marketplaceRevenue).toBe(90000);
    expect(s.posSales).toBe(50000);
    expect(s.grossRevenue).toBe(150000);
    expect(s.commissions).toBe(10000);
    expect(s.cogs).toBe(30000);
    expect(s.netEarnings).toBe(140000);
    expect(s.netProfit).toBe(110000);
    expect(s.orderCount).toBe(3);
    expect(s.posTransactionCount).toBe(4);
    expect(s.purchaseOrderCount).toBe(2);
    expect(s.walletCredits).toBe(20000);
    expect(s.withdrawals).toBe(15000);
    expect(s.otherDebits).toBe(5000);
    expect(s.netCashFlow).toBe(140000 + 20000 - 15000 - 5000);
  });

  it('should return zeros when there is no activity', async () => {
    const service = new VendorAccountingService(makeDataSource({}));
    const s = await service.summary(TENANT_ID, VENDOR_ID, range());
    expect(s.netEarnings).toBe(0);
    expect(s.grossRevenue).toBe(0);
    expect(s.netCashFlow).toBe(0);
  });
});

describe('VendorAccountingService.ledger', () => {
  it('should build a sorted, typed list of entries', async () => {
    const service = new VendorAccountingService(
      makeDataSource({
        paymentRows: [
          {
            id: 'pay-1',
            order_id: 'order-1',
            system_commission: '2000',
            vendor_net: '18000',
            confirmed_at: new Date('2026-01-02T10:00:00.000Z'),
            created_at: new Date('2026-01-02T10:00:00.000Z'),
          },
        ],
        saleRows: [
          {
            id: 'sale-1',
            sale_number: 'POS-20260102-0001',
            total: '12000',
            status: 'COMPLETED',
            created_at: new Date('2026-01-03T12:00:00.000Z'),
          },
        ],
        walletRows: [
          {
            id: 'w-1',
            type: 'CREDIT',
            amount: '5000',
            description: 'Top-up',
            reference_type: 'topup',
            created_at: new Date('2026-01-04T08:00:00.000Z'),
          },
          {
            id: 'w-2',
            type: 'DEBIT',
            amount: '7000',
            description: 'Withdrawal',
            reference_type: 'withdrawal',
            created_at: new Date('2026-01-05T09:00:00.000Z'),
          },
        ],
      }),
    );

    const entries = await service.ledger(TENANT_ID, VENDOR_ID, range());

    expect(entries).toHaveLength(5);
    expect(entries[0].type).toBe('WITHDRAWAL');
    expect(entries[0].amount).toBe(-7000);
    expect(entries.some((e) => e.type === 'ORDER_PAYOUT' && e.amount === 18000)).toBe(true);
    expect(entries.some((e) => e.type === 'COMMISSION' && e.amount === -2000)).toBe(true);
    expect(entries.find((e) => e.type === 'POS_SALE')?.amount).toBe(12000);
    expect(entries.find((e) => e.type === 'WALLET_CREDIT')?.amount).toBe(5000);
  });

  it('should return an empty list when nothing exists', async () => {
    const service = new VendorAccountingService(makeDataSource({}));
    const entries = await service.ledger(TENANT_ID, VENDOR_ID, range());
    expect(entries).toHaveLength(0);
  });

  it('should include received purchase orders as negative COGS entries', async () => {
    const service = new VendorAccountingService(
      makeDataSource({
        poRows: [
          {
            id: 'po-1',
            po_number: 'PO-20260106-0001',
            total_cost: '25000',
            received_at: new Date('2026-01-06T11:00:00.000Z'),
          },
        ],
      }),
    );
    const entries = await service.ledger(TENANT_ID, VENDOR_ID, range());
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('PURCHASE');
    expect(entries[0].amount).toBe(-25000);
    expect(entries[0].description).toContain('PO-20260106-0001');
  });
});

describe('VendorAccountingService.daily/report', () => {
  it('should roll entries into per-day rows and produce a full report', async () => {
    const service = new VendorAccountingService(
      makeDataSource({
        paymentOne: { gross: '50000', commission: '5000', net: '45000', count: '1' },
        saleOne: { pos: '20000', posCount: '2' },
        walletOne: { credits: '0', withdrawals: '10000', otherDebits: '0' },
        paymentRows: [
          {
            id: 'pay-1',
            order_id: 'order-1',
            system_commission: '5000',
            vendor_net: '45000',
            confirmed_at: new Date('2026-01-02T10:00:00.000Z'),
            created_at: new Date('2026-01-02T10:00:00.000Z'),
          },
        ],
        saleRows: [
          {
            id: 'sale-1',
            sale_number: 'POS-20260102-0001',
            total: '20000',
            status: 'COMPLETED',
            created_at: new Date('2026-01-02T12:00:00.000Z'),
          },
        ],
        walletRows: [
          {
            id: 'w-1',
            type: 'DEBIT',
            amount: '10000',
            description: 'Withdrawal',
            reference_type: 'withdrawal',
            created_at: new Date('2026-01-02T15:00:00.000Z'),
          },
        ],
      }),
    );

    const report = await service.report(TENANT_ID, VENDOR_ID, range());

    expect(report.summary.netEarnings).toBe(65000);
    expect(report.daily).toHaveLength(1);
    expect(report.daily[0].marketplaceRevenue).toBe(45000);
    expect(report.daily[0].posSales).toBe(20000);
    expect(report.daily[0].commissions).toBe(5000);
    expect(report.daily[0].withdrawals).toBe(10000);
    expect(report.daily[0].net).toBe(50000);
    expect(report.entries).toHaveLength(4);
  });
});

describe('VendorAccountingService.statements balance sheet', () => {
  it('builds assets, liabilities and equity that balance', async () => {
    const service = new VendorAccountingService(
      makeDataSource({
        walletOne: { credits: '100000', withdrawals: '0', otherDebits: '0' },
        wallet: { balance: '100000' },
        productOne: { inventory: '250000' },
        balanceSheetAccounts: [
          { id: 'a-1', name: 'Equipment', category: 'asset', amount: 50000 },
          { id: 'l-1', name: 'Supplier payables', category: 'liability', amount: 30000 },
        ],
        loanOutstanding: '20000',
      }),
    );

    const stmts = await service.statements(TENANT_ID, VENDOR_ID, range());
    const p = stmts.financialPosition;

    expect(p.assets.map((l) => [l.label, l.amount])).toEqual([
      ['Cash (wallet balance)', 100000],
      ['Inventory (stock at retail price)', 250000],
      ['Equipment', 50000],
    ]);
    expect(p.totalAssets).toBe(400000);

    expect(p.liabilities.map((l) => [l.label, l.amount])).toEqual([
      ['Loans payable', 20000],
      ['Supplier payables', 30000],
    ]);
    expect(p.totalLiabilities).toBe(50000);

    expect(p.ownerCapital).toBe(100000);
    expect(p.totalEquity).toBe(350000);
    expect(p.retainedEarnings).toBe(250000);
    expect(p.totalAssets).toBe(p.totalLiabilities + p.totalEquity);
    expect(p.cash).toBe(100000);
  });

  it('balances to cash only when there is no stock, debt or manual accounts', async () => {
    const service = new VendorAccountingService(
      makeDataSource({
        walletOne: { credits: '30000', withdrawals: '0', otherDebits: '0' },
        wallet: { balance: '30000' },
      }),
    );

    const stmts = await service.statements(TENANT_ID, VENDOR_ID, range());
    const p = stmts.financialPosition;

    expect(p.totalAssets).toBe(30000);
    expect(p.totalLiabilities).toBe(0);
    expect(p.totalEquity).toBe(30000);
    expect(p.retainedEarnings).toBe(0);
  });
});

describe('vendor-accounting-range helpers', () => {
  it('should expose all preset periods and entry types', () => {
    expect(ACCOUNTING_PERIODS).toContain('30d');
    expect(ACCOUNTING_ENTRY_TYPES).toContain('ORDER_PAYOUT');
    expect(ACCOUNTING_ENTRY_TYPES).toContain('COMMISSION');
    expect(ACCOUNTING_ENTRY_TYPES).toContain('PURCHASE');
  });

  it('should default to 30d when period is unknown', () => {
    const r = resolvePeriodRange(undefined as any);
    expect(r.since.getTime()).toBeLessThan(r.until.getTime());
  });

  it('should parse a custom range and reject invalid dates', () => {
    const r = resolveCustomRange('2026-01-01', '2026-01-31');
    expect(r.since.getFullYear()).toBe(2026);
    expect(r.since.getMonth()).toBe(0);
    expect(r.since.getDate()).toBe(1);
    expect(r.until.getDate()).toBe(1);
    expect(r.until.getMonth()).toBe(1);
    expect(r.until.getFullYear()).toBe(2026);
    expect(() => resolveCustomRange('not-a-date')).toThrow('Invalid date range');
    expect(() => resolveCustomRange('2026-01-31', '2026-01-01')).toThrow('Invalid date range');
  });
});