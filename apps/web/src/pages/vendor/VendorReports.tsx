import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { AccountingPeriod, BalanceSheetAccount, VendorStatements } from '../../types';



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
  { key: 'position', label: 'Balance Sheet' },
] as const;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem' },
  controls: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  periodBtn: { padding: '0.45rem 0.85rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  periodBtnActive: { padding: '0.45rem 0.85rem', border: '1px solid #2563eb', background: 'var(--info)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  refreshBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  exportBtn: { padding: '0.5rem 1rem', border: '1px solid #047857', background: 'var(--success)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  printBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' },
  tab: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', color: 'var(--text)' },
  tabActive: { padding: '0.5rem 1rem', border: '1px solid #2563eb', background: 'var(--info-soft)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', color: '#1d4ed8' },
  panel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.25rem', overflow: 'hidden' },
  panelHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', background: 'var(--bg)', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid #f1f5f9' },
  tdRight: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid #f1f5f9', textAlign: 'right' },
  total: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink)', borderBottom: '1px solid #f1f5f9', fontWeight: 800 },
  totalRight: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink)', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800 },
  note: { padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--muted)', background: 'var(--bg)', borderTop: '1px solid #e2e8f0' },
  empty: { textAlign: 'center', color: 'var(--faint)', padding: '2rem' },
  pos: { color: 'var(--success)' },
  neg: { color: 'var(--danger)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '440px', maxWidth: '92vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
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
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [period, setPeriod] = useState<AccountingPeriod>('30d');
  const [tab, setTab] = useState<string>('income');

  const query = `/vendor/accounting/statements?period=${period}`;
  const { data: raw, loading, error, refetch } = useApi<VendorStatements>(query, [query]);

  const report: VendorStatements | null = raw && typeof raw === 'object' && 'incomeStatement' in raw ? raw : null;

  const { data: accountsRaw, refetch: refetchAccounts } = useApi<BalanceSheetAccount[]>('/vendor/accounting/balance-sheet-accounts');
  const accounts: BalanceSheetAccount[] = Array.isArray(accountsRaw) ? accountsRaw : [];

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BalanceSheetAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', category: 'asset' as 'asset' | 'liability', amount: '' });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountBusyId, setAccountBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm({ name: '', category: 'asset', amount: '' });
    setAccountError(null);
    setAccountModalOpen(true);
  };

  const openEditAccount = (a: BalanceSheetAccount) => {
    setEditingAccount(a);
    setAccountForm({ name: a.name, category: a.category, amount: String(a.amount) });
    setAccountError(null);
    setAccountModalOpen(true);
  };

  const saveAccount = async () => {
    const name = accountForm.name.trim();
    const amount = Number(accountForm.amount);
    if (!name) {
      setAccountError('Account name is required.');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      setAccountError('Amount must be a positive number.');
      return;
    }
    setAccountSaving(true);
    setAccountError(null);
    try {
      const body = { name, category: accountForm.category, amount };
      if (editingAccount) {
        await api.patch(`/vendor/accounting/balance-sheet-accounts/${editingAccount.id}`, body);
      } else {
        await api.post('/vendor/accounting/balance-sheet-accounts', body);
      }
      setAccountModalOpen(false);
      await Promise.all([refetchAccounts(), refetch()]);
    } catch (err: any) {
      setAccountError(err.response?.data?.message || err.message || 'Failed to save account.');
    } finally {
      setAccountSaving(false);
    }
  };

  const removeAccount = async (a: BalanceSheetAccount) => {
    if (!window.confirm(`Delete "${a.name}" from the balance sheet?`)) return;
    setActionError(null);
    setAccountBusyId(a.id);
    try {
      await api.delete(`/vendor/accounting/balance-sheet-accounts/${a.id}`);
      await Promise.all([refetchAccounts(), refetch()]);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to delete account.');
    } finally {
      setAccountBusyId(null);
    }
  };

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
      downloadCsv(`balance-sheet-${stamp}.csv`, [
        ['Line', 'Amount'],
        ...p.assets.map((l) => [l.label, l.amount]),
        ['Total Assets', p.totalAssets],
        ...p.liabilities.map((l) => [l.label, l.amount]),
        ['Total Liabilities', p.totalLiabilities],
        ['Owner Capital (top-ups)', p.ownerCapital],
        ['Retained Earnings', p.retainedEarnings],
        ['Total Equity', p.totalEquity],
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
      {actionError && <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>{actionError}</div>}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('vendor.reports.title')}</h1>
          <div style={styles.subtitle}>
            {report?.shopName ? `${report.shopName} — ${t('vendor.reports.standardStatements')}` : t('vendor.reports.standardFinancialStatements')}
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
          <button style={styles.refreshBtn} onClick={() => refetch()}>{t('vendor.reports.refresh')}</button>
          <button style={styles.printBtn} onClick={() => window.print()}>{t('vendor.reports.print')}</button>
          <button style={styles.exportBtn} onClick={exportCsv} disabled={!report}>{t('vendor.reports.csv')}</button>
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
        <div style={styles.empty}>{t('vendor.reports.noData')}</div>
      ) : (
        <>
          {tab === 'income' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>{t('vendor.reports.incomeStatement')}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                  {period === 'all_time' ? 'All time' : `Last ${period}`} Â· {report.incomeStatement.currency}
                </span>
              </div>
              <table style={styles.table}>
                <tbody>
                  {incomeRows.map((r, i) => (
                    <tr key={i}>
                      <td style={r.bold ? styles.total : styles.td}>{r.label}</td>
                      <td style={{ ...(r.bold ? styles.totalRight : styles.tdRight), ...(r.neg ? styles.neg : styles.pos) }}>
                        {r.amount < 0 ? `(${formatCurrency(Math.abs(r.amount))})` : formatCurrency(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={styles.note}>
                Net Profit = Gross Revenue âˆ’ Platform Commission âˆ’ Cost of Goods Sold. Cost of goods sold is based on received purchase orders; POS cash-in-hand is not included.
              </div>
            </div>
          )}

          {tab === 'cashflow' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>{t('vendor.reports.cashFlowStatement')}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{report.cashFlow.currency}</span>
              </div>
              <table style={styles.table}>
                <tbody>
                  {cashRows.map((r, i) => (
                    <tr key={i}>
                      <td style={r.bold ? styles.total : styles.td}>{r.label}</td>
                      <td style={{ ...(r.bold ? styles.totalRight : styles.tdRight), ...(r.neg ? styles.neg : styles.pos) }}>
                        {r.amount < 0 ? `(${formatCurrency(Math.abs(r.amount))})` : formatCurrency(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={styles.note}>
                Closing cash reflects the current wallet balance. Opening cash is derived (closing âˆ’ net movement).
              </div>
            </div>
          )}

          {tab === 'trial' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>{t('vendor.reports.trialBalance')}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                  Totals: {formatCurrency(totalTrialDebit)} / {formatCurrency(totalTrialCredit)} {report.trialBalance[0]?.currency ?? ''}
                </span>
              </div>
              {report.trialBalance.length === 0 ? (
                <div style={styles.empty}>{t('vendor.reports.noLedgerActivity')}</div>
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
                        <td style={{ ...styles.tdRight, color: r.debit !== 0 ? 'var(--ink)' : 'var(--line)' }}>{r.debit !== 0 ? formatCurrency(r.debit) : 'â€”'}</td>
                        <td style={{ ...styles.tdRight, color: r.credit !== 0 ? 'var(--ink)' : 'var(--line)' }}>{r.credit !== 0 ? formatCurrency(r.credit) : 'â€”'}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={styles.total}>Total</td>
                      <td style={styles.totalRight}>{formatCurrency(totalTrialDebit)}</td>
                      <td style={styles.totalRight}>{formatCurrency(totalTrialCredit)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'position' && (
            <>
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <span>{t('vendor.reports.balanceSheet')}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                    As of {new Date(report.asOf).toLocaleDateString()} Â· {report.financialPosition.currency}
                  </span>
                </div>
                <table style={styles.table}>
                  <tbody>
                    <tr>
                      <td style={{ ...styles.td, fontWeight: 700, background: 'var(--bg)' }}>{t('vendor.reports.assets')}</td>
                      <td style={styles.tdRight}></td>
                    </tr>
                    {report.financialPosition.assets.map((l, i) => (
                      <tr key={`asset-${i}`}>
                        <td style={styles.td}>
                          {l.label}
                          {l.auto && <span style={{ color: 'var(--faint)', fontSize: '0.72rem', marginLeft: '0.35rem' }}>(auto)</span>}
                        </td>
                        <td style={{ ...styles.tdRight, ...styles.pos }}>{formatCurrency(l.amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={styles.total}>{t('vendor.reports.totalAssets')}</td>
                      <td style={styles.totalRight}>{formatCurrency(report.financialPosition.totalAssets)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.td, fontWeight: 700, background: 'var(--bg)' }}>{t('vendor.reports.liabilities')}</td>
                      <td style={styles.tdRight}></td>
                    </tr>
                    {report.financialPosition.liabilities.map((l, i) => (
                      <tr key={`liability-${i}`}>
                        <td style={styles.td}>
                          {l.label}
                          {l.auto && <span style={{ color: 'var(--faint)', fontSize: '0.72rem', marginLeft: '0.35rem' }}>(auto)</span>}
                        </td>
                        <td style={{ ...styles.tdRight, ...styles.neg }}>{formatCurrency(l.amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={styles.total}>{t('vendor.reports.totalLiabilities')}</td>
                      <td style={styles.totalRight}>{formatCurrency(report.financialPosition.totalLiabilities)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.td, fontWeight: 700, background: 'var(--bg)' }}>{t('vendor.reports.ownersEquity')}</td>
                      <td style={styles.tdRight}></td>
                    </tr>
                    <tr>
                      <td style={styles.td}>{t('vendor.reports.ownerCapital')}</td>
                      <td style={{ ...styles.tdRight, ...styles.pos }}>{formatCurrency(report.financialPosition.ownerCapital)}</td>
                    </tr>
                    <tr>
                      <td style={styles.td}>{t('vendor.reports.retainedEarnings')}</td>
                      <td style={{ ...styles.tdRight, ...styles.pos }}>{formatCurrency(report.financialPosition.retainedEarnings)}</td>
                    </tr>
                    <tr>
                      <td style={styles.total}>{t('vendor.reports.totalEquity')}</td>
                      <td style={styles.totalRight}>{formatCurrency(report.financialPosition.totalEquity)}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={styles.note}>
                  Assets = Liabilities + Equity. Cash and loans payable are tracked automatically; inventory is
                  estimated at retail price from current stock (status â‰  DELETED). Use "Manage accounts" below to add
                  other assets (equipment, receivables) and liabilities (supplier payables, taxes).
                </div>
              </div>

              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <span>{t('vendor.reports.manageAccounts')}</span>
                  <button
                    style={{ ...styles.refreshBtn, background: '#1e40af', border: 'none', color: '#fff' }}
                    onClick={openCreateAccount}
                  >
                    + {t('vendor.reports.addAccount')}
                  </button>
                </div>
                {accounts.length === 0 ? (
                  <div style={styles.empty}>{t('vendor.reports.noManualAccounts')}</div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Type</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((a) => (
                        <tr key={a.id}>
                          <td style={styles.td}>{a.name}</td>
                          <td style={styles.td}>
                            <span style={{ ...(a.category === 'asset' ? styles.pos : styles.neg), fontWeight: 600 }}>
                              {a.category === 'asset' ? 'Asset' : 'Liability'}
                            </span>
                          </td>
                          <td style={styles.tdRight}>{formatCurrency(a.amount)} {a.currency}</td>
                          <td style={{ ...styles.tdRight, whiteSpace: 'nowrap' }}>
                            <button style={{ ...styles.refreshBtn, marginRight: '0.4rem' }} onClick={() => openEditAccount(a)}>Edit</button>
                            <button
                              style={{ ...styles.refreshBtn, borderColor: '#fecaca', color: 'var(--danger)' }}
                              onClick={() => removeAccount(a)}
                              disabled={accountBusyId === a.id}
                            >
                              {accountBusyId === a.id ? '...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {accountModalOpen && (
                <div style={styles.overlay}>
                  <div style={styles.modal}>
                    <div style={styles.modalTitle}>{editingAccount ? t('vendor.reports.editAccount') : t('vendor.reports.addAccount')}</div>
                    <div style={styles.field}>
                      <label style={styles.label}>{t('vendor.reports.name')}</label>
                      <input
                        style={styles.input}
                        value={accountForm.name}
                        onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Shop equipment, Supplier payables"
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>{t('vendor.reports.type')}</label>
                      <select
                        style={styles.input}
                        value={accountForm.category}
                        onChange={(e) => setAccountForm((f) => ({ ...f, category: e.target.value as 'asset' | 'liability' }))}
                      >
                        <option value="asset">Asset</option>
                        <option value="liability">Liability</option>
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>{t('vendor.reports.amountTzs')}</label>
                      <input
                        style={styles.input}
                        type="number"
                        min={0}
                        value={accountForm.amount}
                        onChange={(e) => setAccountForm((f) => ({ ...f, amount: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    {accountError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{accountError}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                      <button style={styles.refreshBtn} onClick={() => setAccountModalOpen(false)}>{t('vendor.reports.cancel')}</button>
                      <button
                        style={{ ...styles.refreshBtn, background: '#1e40af', border: 'none', color: '#fff' }}
                        onClick={saveAccount}
                        disabled={accountSaving}
                      >
                        {accountSaving ? t('vendor.reports.saving') : t('vendor.reports.save')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
