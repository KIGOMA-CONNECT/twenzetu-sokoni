import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  PaymentOrmEntity,
  ProductSaleOrmEntity,
  WalletTransactionOrmEntity,
  PurchaseOrderOrmEntity,
} from '@afri-market/marketplace-infrastructure';
import {
  AccountingDateRange,
  AccountingEntry,
  AccountingEntryType,
} from './vendor-accounting-range';

export interface VendorAccountingSummary {
  currency: string;
  marketplaceRevenue: number;
  posSales: number;
  grossRevenue: number;
  commissions: number;
  cogs: number;
  netEarnings: number;
  netProfit: number;
  orderCount: number;
  posTransactionCount: number;
  purchaseOrderCount: number;
  walletCredits: number;
  withdrawals: number;
  otherDebits: number;
  netCashFlow: number;
}

export interface AccountingDailyRow {
  date: string;
  marketplaceRevenue: number;
  posSales: number;
  commissions: number;
  cogs: number;
  withdrawals: number;
  net: number;
}

interface PaymentRow {
  id: string;
  order_id: string;
  amount: string;
  system_commission: string;
  vendor_net: string;
  confirmed_at: Date | null;
  created_at: Date;
}

interface SaleRow {
  id: string;
  sale_number: string;
  total: string;
  status: string;
  created_at: Date;
}

interface WalletTxRow {
  id: string;
  type: string;
  amount: string;
  description: string | null;
  reference_type: string | null;
  created_at: Date;
}

interface PoRow {
  id: string;
  po_number: string;
  total_cost: string;
  received_at: Date | null;
}

@Injectable()
export class VendorAccountingService {
  constructor(private readonly dataSource: DataSource) {}

  public async summary(
    tenantId: string,
    vendorId: string,
    range: AccountingDateRange,
  ): Promise<VendorAccountingSummary> {
    const { since, until } = range;
    const paymentRepo = this.dataSource.getRepository(PaymentOrmEntity);
    const saleRepo = this.dataSource.getRepository(ProductSaleOrmEntity);
    const walletTxRepo = this.dataSource.getRepository(WalletTransactionOrmEntity);
    const poRepo = this.dataSource.getRepository(PurchaseOrderOrmEntity);

    const [payments, posSales, walletTx, purchases] = await Promise.all([
      paymentRepo
        .createQueryBuilder('p')
        .select([
          'COALESCE(SUM(p.amount), 0) AS "gross"',
          'COALESCE(SUM(p.system_commission), 0) AS "commission"',
          'COALESCE(SUM(p.vendor_net), 0) AS "net"',
          'COUNT(*) AS "count"',
        ])
        .where('p.tenant_id = :tenantId', { tenantId })
        .andWhere('p.vendor_id = :vendorId', { vendorId })
        .andWhere('p.status = :status', { status: 'RELEASED' })
        .andWhere('p.created_at >= :since', { since })
        .andWhere('p.created_at < :until', { until })
        .getRawOne(),
      saleRepo
        .createQueryBuilder('s')
        .select([
          "COALESCE(SUM(CASE WHEN s.status = 'COMPLETED' THEN s.total ELSE 0 END), 0) AS \"pos\"",
          "COUNT(*) FILTER (WHERE s.status = 'COMPLETED') AS \"posCount\"",
        ])
        .where('s.tenant_id = :tenantId', { tenantId })
        .andWhere('s.vendor_id = :vendorId', { vendorId })
        .andWhere('s.created_at >= :since', { since })
        .andWhere('s.created_at < :until', { until })
        .getRawOne(),
      walletTxRepo
        .createQueryBuilder('wt')
        .select([
          "COALESCE(SUM(CASE WHEN wt.type = 'CREDIT' AND wt.reference_type IS DISTINCT FROM 'payment' THEN wt.amount ELSE 0 END), 0) AS \"credits\"",
          "COALESCE(SUM(CASE WHEN wt.type = 'DEBIT' AND wt.reference_type = 'withdrawal' THEN wt.amount ELSE 0 END), 0) AS \"withdrawals\"",
          "COALESCE(SUM(CASE WHEN wt.type = 'DEBIT' AND wt.reference_type IS DISTINCT FROM 'withdrawal' THEN wt.amount ELSE 0 END), 0) AS \"otherDebits\"",
        ])
        .where('wt.tenant_id = :tenantId', { tenantId })
        .andWhere('wt.owner_id = :vendorId', { vendorId })
        .andWhere('wt.owner_type = :ownerType', { ownerType: 'vendor' })
        .andWhere('wt.created_at >= :since', { since })
        .andWhere('wt.created_at < :until', { until })
        .getRawOne(),
      poRepo
        .createQueryBuilder('po')
        .select([
          "COALESCE(SUM(po.total_cost), 0) AS \"cogs\"",
          "COUNT(*) FILTER (WHERE po.status IN ('RECEIVED', 'CONFIRMED', 'COMPLETED')) AS \"poCount\"",
        ])
        .where('po.tenant_id = :tenantId', { tenantId })
        .andWhere('po.vendor_id = :vendorId', { vendorId })
        .andWhere("po.status IN ('RECEIVED', 'CONFIRMED', 'COMPLETED')")
        .andWhere('po.received_at >= :since', { since })
        .andWhere('po.received_at < :until', { until })
        .getRawOne(),
    ]);

    const gross = Number(payments.gross);
    const commissions = Number(payments.commission);
    const posSalesTotal = Number(posSales.pos);
    const walletCredits = Number(walletTx.credits);
    const withdrawals = Number(walletTx.withdrawals);
    const otherDebits = Number(walletTx.otherDebits);
    const cogs = Number(purchases.cogs);

    const netEarnings = gross + posSalesTotal - commissions;
    const netProfit = netEarnings - cogs;

    return {
      currency: 'TZS',
      marketplaceRevenue: Number(payments.net),
      posSales: posSalesTotal,
      grossRevenue: gross + posSalesTotal,
      commissions,
      cogs,
      netEarnings,
      netProfit,
      orderCount: Number(payments.count),
      posTransactionCount: Number(posSales.posCount),
      purchaseOrderCount: Number(purchases.poCount),
      walletCredits,
      withdrawals,
      otherDebits,
      netCashFlow: netEarnings + walletCredits - withdrawals - otherDebits,
    };
  }

  public async ledger(
    tenantId: string,
    vendorId: string,
    range: AccountingDateRange,
  ): Promise<AccountingEntry[]> {
    const { since, until } = range;
    const paymentRepo = this.dataSource.getRepository(PaymentOrmEntity);
    const saleRepo = this.dataSource.getRepository(ProductSaleOrmEntity);
    const walletTxRepo = this.dataSource.getRepository(WalletTransactionOrmEntity);
    const poRepo = this.dataSource.getRepository(PurchaseOrderOrmEntity);

    const [payments, sales, walletTx, purchases] = await Promise.all([
      paymentRepo
        .createQueryBuilder('p')
        .select([
          'p.id AS "id"',
          'p.order_id AS "order_id"',
          'p.system_commission AS "system_commission"',
          'p.vendor_net AS "vendor_net"',
          'p.confirmed_at AS "confirmed_at"',
          'p.created_at AS "created_at"',
        ])
        .where('p.tenant_id = :tenantId', { tenantId })
        .andWhere('p.vendor_id = :vendorId', { vendorId })
        .andWhere('p.status = :status', { status: 'RELEASED' })
        .andWhere('p.created_at >= :since', { since })
        .andWhere('p.created_at < :until', { until })
        .orderBy('p.created_at', 'DESC')
        .getRawMany(),
      saleRepo
        .createQueryBuilder('s')
        .select([
          's.id AS "id"',
          's.sale_number AS "sale_number"',
          's.total AS "total"',
          's.status AS "status"',
          's.created_at AS "created_at"',
        ])
        .where('s.tenant_id = :tenantId', { tenantId })
        .andWhere('s.vendor_id = :vendorId', { vendorId })
        .andWhere('s.created_at >= :since', { since })
        .andWhere('s.created_at < :until', { until })
        .orderBy('s.created_at', 'DESC')
        .getRawMany(),
      walletTxRepo
        .createQueryBuilder('wt')
        .select([
          'wt.id AS "id"',
          'wt.type AS "type"',
          'wt.amount AS "amount"',
          'wt.description AS "description"',
          'wt.reference_type AS "reference_type"',
          'wt.created_at AS "created_at"',
        ])
        .where('wt.tenant_id = :tenantId', { tenantId })
        .andWhere('wt.owner_id = :vendorId', { vendorId })
        .andWhere('wt.owner_type = :ownerType', { ownerType: 'vendor' })
        .andWhere("wt.reference_type IS DISTINCT FROM 'payment'")
        .andWhere('wt.created_at >= :since', { since })
        .andWhere('wt.created_at < :until', { until })
        .orderBy('wt.created_at', 'DESC')
        .getRawMany(),
      poRepo
        .createQueryBuilder('po')
        .select([
          'po.id AS "id"',
          'po.po_number AS "po_number"',
          'po.total_cost AS "total_cost"',
          'po.received_at AS "received_at"',
        ])
        .where('po.tenant_id = :tenantId', { tenantId })
        .andWhere('po.vendor_id = :vendorId', { vendorId })
        .andWhere("po.status IN ('RECEIVED', 'CONFIRMED', 'COMPLETED')")
        .andWhere('po.received_at >= :since', { since })
        .andWhere('po.received_at < :until', { until })
        .orderBy('po.received_at', 'DESC')
        .getRawMany(),
    ]);

    const entries: AccountingEntry[] = [];

    for (const p of payments as PaymentRow[]) {
      const date = new Date(p.confirmed_at ?? p.created_at).toISOString();
      entries.push({
        id: `payout:${p.id}`,
        date,
        type: 'ORDER_PAYOUT',
        description: p.order_id ? `Order payout (${p.order_id.slice(0, 8)})` : 'Order payout',
        amount: Number(p.vendor_net),
        referenceId: p.id,
      });
      const commission = Number(p.system_commission);
      if (commission !== 0) {
        entries.push({
          id: `commission:${p.id}`,
          date,
          type: 'COMMISSION',
          description: 'Platform commission',
          amount: -commission,
          referenceId: p.id,
        });
      }
    }

    for (const s of sales as SaleRow[]) {
      const amount = s.status === 'COMPLETED' ? Number(s.total) : -Number(s.total);
      entries.push({
        id: `pos:${s.id}`,
        date: new Date(s.created_at).toISOString(),
        type: 'POS_SALE',
        description: `POS sale ${s.sale_number}`,
        amount,
        referenceId: s.id,
      });
    }

    for (const t of walletTx as WalletTxRow[]) {
      if (t.type === 'CREDIT') {
        entries.push({
          id: `wallet:${t.id}`,
          date: new Date(t.created_at).toISOString(),
          type: 'WALLET_CREDIT',
          description: t.description ?? 'Wallet credit',
          amount: Number(t.amount),
          referenceId: t.id,
        });
      } else if (t.reference_type === 'withdrawal') {
        entries.push({
          id: `wallet:${t.id}`,
          date: new Date(t.created_at).toISOString(),
          type: 'WITHDRAWAL',
          description: t.description ?? 'Withdrawal',
          amount: -Number(t.amount),
          referenceId: t.id,
        });
      } else {
        entries.push({
          id: `wallet:${t.id}`,
          date: new Date(t.created_at).toISOString(),
          type: 'WALLET_DEBIT',
          description: t.description ?? 'Wallet debit',
          amount: -Number(t.amount),
          referenceId: t.id,
        });
      }
    }

    for (const po of purchases as PoRow[]) {
      const date = new Date(po.received_at ?? new Date()).toISOString();
      entries.push({
        id: `purchase:${po.id}`,
        date,
        type: 'PURCHASE',
        description: `Stock purchase ${po.po_number}`,
        amount: -Number(po.total_cost),
        referenceId: po.id,
      });
    }

    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries;
  }

  public async daily(
    tenantId: string,
    vendorId: string,
    range: AccountingDateRange,
  ): Promise<AccountingDailyRow[]> {
    const entries = await this.ledger(tenantId, vendorId, range);
    const map = new Map<string, AccountingDailyRow>();

    for (const entry of entries) {
      const d = new Date(entry.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const row = map.get(key) ?? {
        date: key,
        marketplaceRevenue: 0,
        posSales: 0,
        commissions: 0,
        cogs: 0,
        withdrawals: 0,
        net: 0,
      };
      switch (entry.type) {
        case 'ORDER_PAYOUT':
          row.marketplaceRevenue += entry.amount;
          break;
        case 'POS_SALE':
          row.posSales += entry.amount;
          break;
        case 'COMMISSION':
          row.commissions += -entry.amount;
          break;
        case 'PURCHASE':
          row.cogs += -entry.amount;
          break;
        case 'WITHDRAWAL':
          row.withdrawals += -entry.amount;
          break;
        default:
          break;
      }
      row.net = row.marketplaceRevenue + row.posSales - row.commissions - row.cogs - row.withdrawals;
      map.set(key, row);
    }

    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  public async report(
    tenantId: string,
    vendorId: string,
    range: AccountingDateRange,
  ): Promise<{ summary: VendorAccountingSummary; daily: AccountingDailyRow[]; entries: AccountingEntry[] }> {
    const [summary, daily, entries] = await Promise.all([
      this.summary(tenantId, vendorId, range),
      this.daily(tenantId, vendorId, range),
      this.ledger(tenantId, vendorId, range),
    ]);
    return { summary, daily, entries };
  }
}

export type { AccountingEntryType };
