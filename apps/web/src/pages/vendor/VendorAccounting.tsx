import { Fragment, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { AccountingPeriod, AccountingEntry, VendorAccountingReport } from '../../types';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const PERIODS: { value: AccountingPeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all_time', label: 'All Time' },
];

const ENTRY_LABELS: Record<string, string> = {
  ORDER_PAYOUT: 'Order Payout',
  COMMISSION: 'Platform Commission',
  POS_SALE: 'POS Sale',
  WALLET_CREDIT: 'Wallet Credit',
  WITHDRAWAL: 'Withdrawal',
  WALLET_DEBIT: 'Wallet Debit',
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem' },
  controls: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  periodBtn: { padding: '0.45rem 0.85rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  periodBtnActive: { padding: '0.45rem 0.85rem', border: '1px solid #2563eb', background: 'var(--info)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  dateInput: { padding: '0.45rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'inherit' },
  refreshBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardValue: { fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)' },
  cardLabel: { fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginTop: '0.15rem' },
  panel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.25rem', overflow: 'hidden' },
  panelHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', background: 'var(--bg)', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid #f1f5f9' },
  empty: { textAlign: 'center', color: 'var(--faint)', padding: '2rem' },
  pos: { color: 'var(--success)' },
  neg: { color: 'var(--danger)' },
};

export default function VendorAccounting() {
  const [period, setPeriod] = useState<AccountingPeriod>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const query = useMemo(() => {
    if (from || to) {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return `/vendor/accounting/report?${params.toString()}`;
    }
    return `/vendor/accounting/report?period=${period}`;
  }, [period, from, to]);

  const { data: raw, loading, error, refetch } = useApi<VendorAccountingReport>(query, [query]);

  const report: VendorAccountingReport | null =
    raw && typeof raw === 'object' && 'summary' in raw ? raw : null;

  const sortedEntries = useMemo(() => {
    if (!report) return [];
    return [...report.entries].sort((a, b) => b.date.localeCompare(a.date));
  }, [report]);

  const entriesTotal = sortedEntries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Accounting</h1>
          <div style={styles.subtitle}>
            {report?.shopName ? report.shopName : 'Income, expenses and cash flow'}
          </div>
        </div>
        <div style={styles.controls}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              style={period === p.value && !from && !to ? styles.periodBtnActive : styles.periodBtn}
              onClick={() => {
                setPeriod(p.value);
                setFrom('');
                setTo('');
              }}
            >
              {p.label}
            </button>
          ))}
          <input style={styles.dateInput} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input style={styles.dateInput} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button style={styles.refreshBtn} onClick={() => refetch()}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !report ? (
        <div style={styles.empty}>No data for the selected period</div>
      ) : (
        <>
          <div style={styles.stats}>
            <div style={styles.card}>
              <div style={styles.cardValue}>{fmt(report.summary.marketplaceRevenue)} {report.summary.currency}</div>
              <div style={styles.cardLabel}>Order Payouts ({report.summary.orderCount})</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardValue}>{fmt(report.summary.posSales)}</div>
              <div style={styles.cardLabel}>POS Sales ({report.summary.posTransactionCount})</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardValue}>{fmt(report.summary.grossRevenue)}</div>
              <div style={styles.cardLabel}>Gross Revenue</div>
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.cardValue, color: 'var(--danger)' }}>{fmt(report.summary.commissions)}</div>
              <div style={styles.cardLabel}>Commissions</div>
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.cardValue, color: 'var(--success)' }}>{fmt(report.summary.netEarnings)}</div>
              <div style={styles.cardLabel}>Net Earnings</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardValue}>{fmt(report.summary.netCashFlow)}</div>
              <div style={styles.cardLabel}>Net Cash Flow</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardValue}>{fmt(report.summary.walletCredits)}</div>
              <div style={styles.cardLabel}>Wallet Credits</div>
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.cardValue, color: 'var(--danger)' }}>{fmt(report.summary.withdrawals)}</div>
              <div style={styles.cardLabel}>Withdrawals</div>
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>Daily Breakdown ({report.daily.length} days)</div>
            {report.daily.length === 0 ? (
              <div style={styles.empty}>No activity in this period</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Order Payouts</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>POS Sales</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Commissions</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Withdrawals</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {report.daily.map((row) => (
                    <tr key={row.date}>
                      <td style={styles.td}>{row.date}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(row.marketplaceRevenue)}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(row.posSales)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', color: 'var(--danger)' }}>{fmt(row.commissions)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', color: 'var(--danger)' }}>{fmt(row.withdrawals)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{fmt(row.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>Ledger ({sortedEntries.length} entries, balance {fmt(entriesTotal)})</div>
            {sortedEntries.length === 0 ? (
              <div style={styles.empty}>No ledger entries in this period</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Description</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((e: AccountingEntry) => (
                    <Fragment key={e.id}>
                      <tr>
                        <td style={styles.td}>{new Date(e.date).toLocaleString()}</td>
                        <td style={styles.td}>{ENTRY_LABELS[e.type] ?? e.type}</td>
                        <td style={styles.td}>{e.description}</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, ...(e.amount < 0 ? styles.neg : styles.pos) }}>
                          {e.amount < 0 ? `(${fmt(Math.abs(e.amount))})` : fmt(e.amount)}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}