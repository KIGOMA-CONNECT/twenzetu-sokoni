import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { AccountingPeriod, VendorStatements } from '../../types';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const PERIODS: { value: AccountingPeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all_time', label: 'All Time' },
];

const TABS = [
  { key: 'income', label: 'Income Statement' },
  { key: 'cashflow', label: 'Cash Flow' },
  { key: 'trial', label: 'Trial Balance' },
  { key: 'position', label: 'Financial Position' },
] as const;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '0.85rem' },
  controls: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  periodBtn: { padding: '0.45rem 0.85rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  periodBtnActive: { padding: '0.45rem 0.85rem', border: '1px solid #2563eb', background: '#2563eb', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  refreshBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  exportBtn: { padding: '0.5rem 1rem', border: '1px solid #047857', background: '#047857', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  printBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' },
  tab: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', color: '#334155' },
  tabActive: { padding: '0.5rem 1rem', border: '1px solid #2563eb', background: '#eff6ff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', color: '#1d4ed8' },
  panel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.25rem', overflow: 'hidden' },
  panelHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' },
  td: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  tdRight: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9', textAlign: 'right' },
  total: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#0f172a', borderBottom: '1px solid #f1f5f9', fontWeight: 800 },
  totalRight: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#0f172a', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800 },
  note: { padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', borderTop: '1px solid #e2e8f0' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '2rem' },
  pos: { color: '#047857' },
  neg: { color: '#dc2626' },
};

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VendorReports() {
  const [period, setPeriod] = useState<AccountingPeriod>('30d');
  const [tab, setTab] = useState<string>('income');

  const query = `/vendor/accounting/statements?period=${period}`;
  const { data: raw, loading, error, refetch } = useApi<VendorStatements>(query, [query]);

  const report: VendorStatements | null = raw && typeof raw === 'object' && 'incomeStatement' in raw ? raw : null;

  const exportCsv = () => {
    if (!report) return;
    const stamp = new Date().toISOString().slice(0, 10);
    if (tab === 'income') {
      const s = report.incomeStatement;
      downloadCsv(`income-statement-${period}-${stamp}.csv`, [
        ['Line', 'Amount'],
        ['Gross Revenue', s.grossRevenue],
        ['Platform Commission', -s.commissions],
        ['Net Revenue', s.netRevenue],
        ['Cost of Goods Sold', -s.cogs],
        ['Net Profit', s.netProfit],
      ]);
    } else if (tab === 'cashflow') {
      const c = report.cashFlow;
      downloadCsv(`cash-flow-${period}-${stamp}.csv`, [
        ['Line', 'Amount'],
        ['Opening Cash', c.openingCash],
        ['Net Earnings', c.netEarnings],
        ['Wallet Credits', c.walletCredits],
        ['Withdrawals', -c.withdrawals],
        ['Other Payments', -c.otherDebits],
        ['Net Change', c.netChange],
        ['Closing Cash', c.closingCash],
      ]);
    } else if (tab === 'trial') {
      downloadCsv(`trial-balance-${period}-${stamp}.csv`, [
        ['Account', 'Debit', 'Credit'],
        ...report.trialBalance.map((r) => [r.account, r.debit, r.credit]),
      ]);
    } else {
      const p = report.financialPosition;
      downloadCsv(`financial-position-${stamp}.csv`, [
        ['Line', 'Amount'],
        ['Cash (wallet balance)', p.cash],
        ['Owner Capital (top-ups)', p.ownerCapital],
        ['Retained Earnings', p.retainedEarnings],
      ]);
    }
  };

  const incomeRows: { label: string; amount: number; bold?: boolean; neg?: boolean }[] = report
    ? [
        { label: 'Gross Revenue (orders + POS)', amount: report.incomeStatement.grossRevenue },
        { label: 'Platform Commission', amount: -report.incomeStatement.commissions, neg: true },
        { label: 'Net Revenue', amount: report.incomeStatement.netRevenue, bold: true },
        { label: 'Cost of Goods Sold (purchases)', amount: -report.incomeStatement.cogs, neg: true },
        { label: 'Net Profit', amount: report.incomeStatement.netProfit, bold: true },
      ]
    : [];

  const cashRows: { label: string; amount: number; bold?: boolean; neg?: boolean }[] = report
    ? [
        { label: 'Opening cash balance', amount: report.cashFlow.openingCash },
        { label: 'Net earnings', amount: report.cashFlow.netEarnings },
        { label: 'Wallet credits (top-ups)', amount: report.cashFlow.walletCredits },
        { label: 'Withdrawals', amount: -report.cashFlow.withdrawals, neg: true },
        { label: 'Other payments', amount: -report.cashFlow.otherDebits, neg: true },
        { label: 'Net cash movement', amount: report.cashFlow.netChange, bold: true },
        { label: 'Closing cash balance', amount: report.cashFlow.closingCash, bold: true },
      ]
    : [];

  const totalTrialDebit = report?.trialBalance.reduce((s, r) => s + r.debit, 0) ?? 0;
  const totalTrialCredit = report?.trialBalance.reduce((s, r) => s + r.credit, 0) ?? 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Financial Reports</h1>
          <div style={styles.subtitle}>
            {report?.shopName ? `${report.shopName} — standard statements for loan applications` : 'Standard financial statements'}
          </div>
        </div>
        <div style={styles.controls}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              style={period === p.value ? styles.periodBtnActive : styles.periodBtn}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
          <button style={styles.refreshBtn} onClick={() => refetch()}>Refresh</button>
          <button style={styles.printBtn} onClick={() => window.print()}>Print</button>
          <button style={styles.exportBtn} onClick={exportCsv} disabled={!report}>CSV</button>
        </div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button key={t.key} style={tab === t.key ? styles.tabActive : styles.tab} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !report ? (
        <div style={styles.empty}>No data for the selected period</div>
      ) : (
        <>
          {tab === 'income' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>Income Statement</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                  {period === 'all_time' ? 'All time' : `Last ${period}`} · {report.incomeStatement.currency}
                </span>
              </div>
              <table style={styles.table}>
                <tbody>
                  {incomeRows.map((r, i) => (
                    <tr key={i}>
                      <td style={r.bold ? styles.total : styles.td}>{r.label}</td>
                      <td style={{ ...(r.bold ? styles.totalRight : styles.tdRight), ...(r.neg ? styles.neg : styles.pos) }}>
                        {r.amount < 0 ? `(${fmt(Math.abs(r.amount))})` : fmt(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={styles.note}>
                Net Profit = Gross Revenue − Platform Commission − Cost of Goods Sold. Cost of goods sold is based on received purchase orders; POS cash-in-hand is not included.
              </div>
            </div>
          )}

          {tab === 'cashflow' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>Cash Flow Statement</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{report.cashFlow.currency}</span>
              </div>
              <table style={styles.table}>
                <tbody>
                  {cashRows.map((r, i) => (
                    <tr key={i}>
                      <td style={r.bold ? styles.total : styles.td}>{r.label}</td>
                      <td style={{ ...(r.bold ? styles.totalRight : styles.tdRight), ...(r.neg ? styles.neg : styles.pos) }}>
                        {r.amount < 0 ? `(${fmt(Math.abs(r.amount))})` : fmt(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={styles.note}>
                Closing cash reflects the current wallet balance. Opening cash is derived (closing − net movement).
              </div>
            </div>
          )}

          {tab === 'trial' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>Trial Balance</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                  Totals: {fmt(totalTrialDebit)} / {fmt(totalTrialCredit)} {report.trialBalance[0]?.currency ?? ''}
                </span>
              </div>
              {report.trialBalance.length === 0 ? (
                <div style={styles.empty}>No ledger activity in this period</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Account</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Debit</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.trialBalance.map((r) => (
                      <tr key={r.account}>
                        <td style={styles.td}>{r.account}</td>
                        <td style={{ ...styles.tdRight, color: r.debit !== 0 ? '#0f172a' : '#cbd5e1' }}>{r.debit !== 0 ? fmt(r.debit) : '—'}</td>
                        <td style={{ ...styles.tdRight, color: r.credit !== 0 ? '#0f172a' : '#cbd5e1' }}>{r.credit !== 0 ? fmt(r.credit) : '—'}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={styles.total}>Total</td>
                      <td style={styles.totalRight}>{fmt(totalTrialDebit)}</td>
                      <td style={styles.totalRight}>{fmt(totalTrialCredit)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'position' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>Financial Position (simplified)</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>As of {new Date(report.asOf).toLocaleDateString()}</span>
              </div>
              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 700, background: '#f8fafc' }}>Assets</td>
                    <td style={styles.tdRight}></td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Cash (wallet balance)</td>
                    <td style={{ ...styles.tdRight, ...styles.pos }}>{fmt(report.financialPosition.cash)}</td>
                  </tr>
                  <tr>
                    <td style={styles.total}>Total Assets</td>
                    <td style={styles.totalRight}>{fmt(report.financialPosition.cash)}</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: 700, background: '#f8fafc' }}>Owner's Equity</td>
                    <td style={styles.tdRight}></td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Owner capital (wallet top-ups)</td>
                    <td style={{ ...styles.tdRight, ...styles.pos }}>{fmt(report.financialPosition.ownerCapital)}</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Retained earnings</td>
                    <td style={{ ...styles.tdRight, ...styles.pos }}>{fmt(report.financialPosition.retainedEarnings)}</td>
                  </tr>
                  <tr>
                    <td style={styles.total}>Total Equity</td>
                    <td style={styles.totalRight}>{fmt(report.financialPosition.cash)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={styles.note}>
                Simplified cash-based position. The platform does not yet track inventory, receivables, fixed assets or debt,
                so total assets equal cash in the wallet and total equity equals total assets. For a full balance sheet,
                combine this with your own records of stock, equipment and outstanding liabilities.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
