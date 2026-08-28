import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { AccountingPeriod, BalanceSheetAccount, VendorStatements } from '../../types';



const PERIODS: { value: AccountingPeriod; key: string }[] = [
  { value: '7d', key: 'period7d' },
  { value: '30d', key: 'period30d' },
  { value: '90d', key: 'period90d' },
  { value: 'this_month', key: 'thisMonth' },
  { value: 'last_month', key: 'lastMonth' },
  { value: 'all_time', key: 'allTime' },
];

const TABS = [
  { key: 'income', labelKey: 'incomeStatement' },
  { key: 'cashflow', labelKey: 'cashFlow' },
  { key: 'trial', labelKey: 'trialBalance' },
  { key: 'position', labelKey: 'balanceSheet' },
] as const;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem' },
  controls: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  periodBtn: { padding: '0.45rem 0.85rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  periodBtnActive: { padding: '0.45rem 0.85rem', border: '1px solid #2563eb', background: 'var(--info)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  refreshBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  exportBtn: { padding: '0.5rem 1rem', border: '1px solid #047857', background: 'var(--success)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  printBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' },
  tab: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', color: 'var(--text)' },
  tabActive: { padding: '0.5rem 1rem', border: '1px solid #2563eb', background: 'var(--info-soft)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', color: '#1d4ed8' },
  panel: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', marginBottom: '1.25rem', overflow: 'hidden' },
  panelHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid var(--line)', background: 'var(--bg)', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', borderBottom: '1px solid var(--line)', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' },
  tdRight: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)', textAlign: 'right' },
  total: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink)', borderBottom: '1px solid var(--line)', fontWeight: 800 },
  totalRight: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink)', borderBottom: '1px solid var(--line)', textAlign: 'right', fontWeight: 800 },
  note: { padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--muted)', background: 'var(--bg)', borderTop: '1px solid var(--line)' },
  empty: { textAlign: 'center', color: 'var(--faint)', padding: '2rem' },
  pos: { color: 'var(--success)' },
  neg: { color: 'var(--danger)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '440px', maxWidth: '92vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
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
  const r = 'vendor.reportsPage.';
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
      setAccountError(t(r + 'accountNameRequired'));
      return;
    }
    if (isNaN(amount) || amount < 0) {
      setAccountError(t(r + 'amountMustBePositive'));
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
      setAccountError(err.response?.data?.message || err.message || t(r + 'failedSaveAccount'));
    } finally {
      setAccountSaving(false);
    }
  };

  const removeAccount = async (a: BalanceSheetAccount) => {
    if (!window.confirm(`${t(r + 'deleteConfirmPrefix')}"${a.name}"${t(r + 'deleteConfirmSuffix')}`)) return;
    setActionError(null);
    setAccountBusyId(a.id);
    try {
      await api.delete(`/vendor/accounting/balance-sheet-accounts/${a.id}`);
      await Promise.all([refetchAccounts(), refetch()]);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || t(r + 'failedDeleteAccount'));
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
        ...report.trialBalance.map((row) => [row.account, row.debit, row.credit]),
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
        { label: t(r + 'grossRevenue'), amount: report.incomeStatement.grossRevenue },
        { label: t(r + 'platformCommission'), amount: -report.incomeStatement.commissions, neg: true },
        { label: t(r + 'netRevenue'), amount: report.incomeStatement.netRevenue, bold: true },
        { label: t(r + 'cogs'), amount: -report.incomeStatement.cogs, neg: true },
        { label: t(r + 'netProfit'), amount: report.incomeStatement.netProfit, bold: true },
      ]
    : [];

  const cashRows: { label: string; amount: number; bold?: boolean; neg?: boolean }[] = report
    ? [
        { label: t(r + 'openingCash'), amount: report.cashFlow.openingCash },
        { label: t(r + 'netEarnings'), amount: report.cashFlow.netEarnings },
        { label: t(r + 'walletCredits'), amount: report.cashFlow.walletCredits },
        { label: t(r + 'withdrawals'), amount: -report.cashFlow.withdrawals, neg: true },
        { label: t(r + 'otherPayments'), amount: -report.cashFlow.otherDebits, neg: true },
        { label: t(r + 'netCashMovement'), amount: report.cashFlow.netChange, bold: true },
        { label: t(r + 'closingCash'), amount: report.cashFlow.closingCash, bold: true },
      ]
    : [];

  const totalTrialDebit = report?.trialBalance.reduce((s, row) => s + row.debit, 0) ?? 0;
  const totalTrialCredit = report?.trialBalance.reduce((s, row) => s + row.credit, 0) ?? 0;

  return (
    <div style={styles.container}>
      {actionError && <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>{actionError}</div>}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t(r + 'title')}</h1>
          <div style={styles.subtitle}>
            {report?.shopName ? t(r + 'shopSubtitle', { shop: report.shopName }) : t(r + 'standardStatements')}
          </div>
        </div>
        <div style={styles.controls}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              style={period === p.value ? styles.periodBtnActive : styles.periodBtn}
              onClick={() => setPeriod(p.value)}
            >
              {t(r + p.key)}
            </button>
          ))}
          <button style={styles.refreshBtn} onClick={() => refetch()}>{t(r + 'refresh')}</button>
          <button style={styles.printBtn} onClick={() => window.print()}>{t(r + 'print')}</button>
          <button style={styles.exportBtn} onClick={exportCsv} disabled={!report}>{t(r + 'csv')}</button>
        </div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((tb) => (
          <button key={tb.key} style={tab === tb.key ? styles.tabActive : styles.tab} onClick={() => setTab(tb.key)}>
            {t(r + tb.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !report ? (
        <div style={styles.empty}>{t(r + 'noData')}</div>
      ) : (
        <>
          {tab === 'income' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>{t(r + 'incomeStatement')}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                  {period === 'all_time' ? t(r + 'allTimeLabel') : `${t(r + 'last')} ${period}`} · {report.incomeStatement.currency}
                </span>
              </div>
              <table style={styles.table}>
                <tbody>
                  {incomeRows.map((row, i) => (
                    <tr key={i}>
                      <td style={row.bold ? styles.total : styles.td}>{row.label}</td>
                      <td style={{ ...(row.bold ? styles.totalRight : styles.tdRight), ...(row.neg ? styles.neg : styles.pos) }}>
                        {row.amount < 0 ? `(${formatCurrency(Math.abs(row.amount))})` : formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={styles.note}>
                {t(r + 'incomeNote')}
              </div>
            </div>
          )}

          {tab === 'cashflow' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>{t(r + 'cashFlow')}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{report.cashFlow.currency}</span>
              </div>
              <table style={styles.table}>
                <tbody>
                  {cashRows.map((row, i) => (
                    <tr key={i}>
                      <td style={row.bold ? styles.total : styles.td}>{row.label}</td>
                      <td style={{ ...(row.bold ? styles.totalRight : styles.tdRight), ...(row.neg ? styles.neg : styles.pos) }}>
                        {row.amount < 0 ? `(${formatCurrency(Math.abs(row.amount))})` : formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={styles.note}>
                {t(r + 'cashNote')}
              </div>
            </div>
          )}

          {tab === 'trial' && (
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <span>{t(r + 'trialBalance')}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                  {t(r + 'totals')}: {formatCurrency(totalTrialDebit)} / {formatCurrency(totalTrialCredit)} {report.trialBalance[0]?.currency ?? ''}
                </span>
              </div>
              {report.trialBalance.length === 0 ? (
                <div style={styles.empty}>{t(r + 'noLedgerActivity')}</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{t(r + 'account')}</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>{t(r + 'debit')}</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>{t(r + 'credit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.trialBalance.map((row) => (
                      <tr key={row.account}>
                        <td style={styles.td}>{row.account}</td>
                        <td style={{ ...styles.tdRight, color: row.debit !== 0 ? 'var(--ink)' : 'var(--line)' }}>{row.debit !== 0 ? formatCurrency(row.debit) : '—'}</td>
                        <td style={{ ...styles.tdRight, color: row.credit !== 0 ? 'var(--ink)' : 'var(--line)' }}>{row.credit !== 0 ? formatCurrency(row.credit) : '—'}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={styles.total}>{t(r + 'total')}</td>
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
                  <span>{t(r + 'balanceSheet')}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                    {t(r + 'asOf')} {new Date(report.asOf).toLocaleDateString()} · {report.financialPosition.currency}
                  </span>
                </div>
                <table style={styles.table}>
                  <tbody>
                    <tr>
                      <td style={{ ...styles.td, fontWeight: 700, background: 'var(--bg)' }}>{t(r + 'assets')}</td>
                      <td style={styles.tdRight}></td>
                    </tr>
                    {report.financialPosition.assets.map((l, i) => (
                      <tr key={`asset-${i}`}>
                        <td style={styles.td}>
                          {l.label}
                          {l.auto && <span style={{ color: 'var(--faint)', fontSize: '0.72rem', marginLeft: '0.35rem' }}>({t(r + 'auto')})</span>}
                        </td>
                        <td style={{ ...styles.tdRight, ...styles.pos }}>{formatCurrency(l.amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={styles.total}>{t(r + 'totalAssets')}</td>
                      <td style={styles.totalRight}>{formatCurrency(report.financialPosition.totalAssets)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.td, fontWeight: 700, background: 'var(--bg)' }}>{t(r + 'liabilities')}</td>
                      <td style={styles.tdRight}></td>
                    </tr>
                    {report.financialPosition.liabilities.map((l, i) => (
                      <tr key={`liability-${i}`}>
                        <td style={styles.td}>
                          {l.label}
                          {l.auto && <span style={{ color: 'var(--faint)', fontSize: '0.72rem', marginLeft: '0.35rem' }}>({t(r + 'auto')})</span>}
                        </td>
                        <td style={{ ...styles.tdRight, ...styles.neg }}>{formatCurrency(l.amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={styles.total}>{t(r + 'totalLiabilities')}</td>
                      <td style={styles.totalRight}>{formatCurrency(report.financialPosition.totalLiabilities)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.td, fontWeight: 700, background: 'var(--bg)' }}>{t(r + 'ownersEquity')}</td>
                      <td style={styles.tdRight}></td>
                    </tr>
                    <tr>
                      <td style={styles.td}>{t(r + 'ownerCapital')}</td>
                      <td style={{ ...styles.tdRight, ...styles.pos }}>{formatCurrency(report.financialPosition.ownerCapital)}</td>
                    </tr>
                    <tr>
                      <td style={styles.td}>{t(r + 'retainedEarnings')}</td>
                      <td style={{ ...styles.tdRight, ...styles.pos }}>{formatCurrency(report.financialPosition.retainedEarnings)}</td>
                    </tr>
                    <tr>
                      <td style={styles.total}>{t(r + 'totalEquity')}</td>
                      <td style={styles.totalRight}>{formatCurrency(report.financialPosition.totalEquity)}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={styles.note}>
                  {t(r + 'balanceSheetNote')}
                </div>
              </div>

              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <span>{t(r + 'manageAccounts')}</span>
                  <button
                    style={{ ...styles.refreshBtn, background: '#1e40af', border: 'none', color: '#fff' }}
                    onClick={openCreateAccount}
                  >
                    {t(r + 'addAccount')}
                  </button>
                </div>
                {accounts.length === 0 ? (
                  <div style={styles.empty}>{t(r + 'noManualAccounts')}</div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>{t(r + 'name')}</th>
                        <th style={styles.th}>{t(r + 'type')}</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>{t('vendor.reportsPage.amountTZS')}</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>{t('vendor.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((a) => (
                        <tr key={a.id}>
                          <td style={styles.td}>{a.name}</td>
                          <td style={styles.td}>
                            <span style={{ ...(a.category === 'asset' ? styles.pos : styles.neg), fontWeight: 600 }}>
                              {a.category === 'asset' ? t(r + 'asset') : t(r + 'liability')}
                            </span>
                          </td>
                          <td style={styles.tdRight}>{formatCurrency(a.amount)} {a.currency}</td>
                          <td style={{ ...styles.tdRight, whiteSpace: 'nowrap' }}>
                            <button style={{ ...styles.refreshBtn, marginRight: '0.4rem' }} onClick={() => openEditAccount(a)}>{t('vendor.edit')}</button>
                            <button
                              style={{ ...styles.refreshBtn, borderColor: '#fecaca', color: 'var(--danger)' }}
                              onClick={() => removeAccount(a)}
                              disabled={accountBusyId === a.id}
                            >
                              {accountBusyId === a.id ? '...' : t('vendor.delete')}
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
                    <div style={styles.modalTitle}>{editingAccount ? t(r + 'editAccount') : t(r + 'addAccountTitle')}</div>
                    <div style={styles.field}>
                      <label style={styles.label}>{t(r + 'name')}</label>
                      <input
                        style={styles.input}
                        value={accountForm.name}
                        onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder={t(r + 'namePlaceholder')}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>{t(r + 'type')}</label>
                      <select
                        style={styles.input}
                        value={accountForm.category}
                        onChange={(e) => setAccountForm((f) => ({ ...f, category: e.target.value as 'asset' | 'liability' }))}
                      >
                        <option value="asset">{t(r + 'asset')}</option>
                        <option value="liability">{t(r + 'liability')}</option>
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>{t(r + 'amountTZS')}</label>
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
                      <button style={styles.refreshBtn} onClick={() => setAccountModalOpen(false)}>{t(r + 'cancel')}</button>
                      <button
                        style={{ ...styles.refreshBtn, background: '#1e40af', border: 'none', color: '#fff' }}
                        onClick={saveAccount}
                        disabled={accountSaving}
                      >
                        {accountSaving ? t(r + 'saving') : t('common.save')}
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
