import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class GetReconciliationReportUseCase {
  constructor(private readonly dataSource: DataSource) {}

  public async execute(input: { tenantId: string; period?: 'today' | '7d' | '30d' | '90d' }) {
    const days = input.period === 'today' ? 1 : input.period === '7d' ? 7 : input.period === '30d' ? 30 : input.period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const walletRepo = this.dataSource.getRepository('WalletOrmEntity');
    const paymentRepo = this.dataSource.getRepository('PaymentOrmEntity');
    const walletTxRepo = this.dataSource.getRepository('WalletTransactionOrmEntity');

    const [commissionData, walletTotals, payoutData, pendingWallets] = await Promise.all([
      paymentRepo
        .createQueryBuilder('p')
        .select([
          'COALESCE(SUM(p.system_commission), 0) AS "totalCommission"',
          'COUNT(*) AS "paymentCount"',
          'COALESCE(SUM(CASE WHEN p.status = \'RELEASED\' THEN 1 ELSE 0 END), 0) AS "settledCount"',
          'COALESCE(SUM(p.vendor_net), 0) AS "totalVendorNet"',
          'COALESCE(SUM(p.driver_net), 0) AS "totalDriverNet"',
        ])
        .where('p.tenant_id = :tenantId', { tenantId: input.tenantId })
        .andWhere('p.created_at >= :since', { since })
        .getRawOne(),
      walletRepo
        .createQueryBuilder('w')
        .select([
          'w.owner_type AS "ownerType"',
          'COUNT(*) AS "walletCount"',
          'COALESCE(SUM(w.balance), 0) AS "totalBalance"',
          'COALESCE(SUM(w.pending_balance), 0) AS "totalPending"',
        ])
        .where('w.tenant_id = :tenantId', { tenantId: input.tenantId })
        .groupBy('w.owner_type')
        .getRawMany(),
      walletTxRepo
        .createQueryBuilder('wt')
        .select([
          'COALESCE(SUM(CASE WHEN wt.type = \'CREDIT\' THEN wt.amount ELSE 0 END), 0) AS "totalCredits"',
          'COALESCE(SUM(CASE WHEN wt.type = \'DEBIT\' THEN wt.amount ELSE 0 END), 0) AS "totalDebits"',
          'COUNT(*) AS "txCount"',
        ])
        .where('wt.tenant_id = :tenantId', { tenantId: input.tenantId })
        .andWhere('wt.created_at >= :since', { since })
        .getRawOne(),
      walletRepo
        .createQueryBuilder('w')
        .select([
          'w.owner_id AS "ownerId"',
          'w.owner_type AS "ownerType"',
          'w.balance',
        ])
        .where('w.tenant_id = :tenantId', { tenantId: input.tenantId })
        .andWhere('w.balance > 0')
        .orderBy('w.balance', 'DESC')
        .limit(20)
        .getRawMany(),
    ]);

    return {
      period: input.period ?? '30d',
      since: since.toISOString(),
      commissions: {
        totalCommission: Number(commissionData.totalCommission),
        totalVendorNet: Number(commissionData.totalVendorNet),
        totalDriverNet: Number(commissionData.totalDriverNet),
        paymentCount: Number(commissionData.paymentCount),
        settledCount: Number(commissionData.settledCount),
      },
      wallets: walletTotals.map((w: { ownerType: string; walletCount: string; totalBalance: string; totalPending: string }) => ({
        ownerType: w.ownerType,
        walletCount: Number(w.walletCount),
        totalBalance: Number(w.totalBalance),
        totalPending: Number(w.totalPending),
      })),
      transactions: {
        totalCredits: Number(payoutData.totalCredits),
        totalDebits: Number(payoutData.totalDebits),
        txCount: Number(payoutData.txCount),
      },
      pendingPayouts: pendingWallets.map((w: { ownerId: string; ownerType: string; balance: string }) => ({
        ownerId: w.ownerId,
        ownerType: w.ownerType,
        balance: Number(w.balance),
      })),
    };
  }
}
