import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import LoanManagement from './LoanManagement';
import api from '../../api/client';
import { PageTitle } from '../../components/PageTitle';

type Tab = 'savings' | 'deposits' | 'loans' | 'subscription' | 'commissions';

interface SavingsAccount {
  id: string;
  balance: number;
  frozenBalance: number;
  currency: string;
  status: string;
}

interface SavingsTx {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reference?: string;
  createdAt: string;
}

interface FixedDeposit {
  id: string;
  principal: number;
  interestRate: number;
  durationMonths: number;
  maturityDate: string;
  maturityAmount: number;
  status: string;
  createdAt: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  monthlyPrice: number;
  maxProducts: number;
  maxImagesPerProduct: number;
  commissionRateOverride?: number;
  features: string[];
}

interface CommissionRecord {
  id: string;
  orderId: string;
  payerType: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

interface SubscriptionInvoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  createdAt: string;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

const quickAmounts = [10000, 25000, 50000, 100000, 250000];

export default function FintechPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('savings');

  const isVendor = user?.role === 'vendor';
  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'finance_admin';

  const canCommissions = isVendor || isDriver || isAdmin;

  const tabs: Array<{ id: Tab; label: string; show: boolean }> = [
    { id: 'savings', label: `💼 ${t('fintech.savings')}`, show: true },
    { id: 'deposits', label: `🏦 ${t('fintech.fixedDeposits')}`, show: true },
    { id: 'loans', label: `💰 ${t('fintech.loans')}`, show: true },
    { id: 'subscription', label: `⭐ ${t('fintech.subscription')}`, show: isVendor },
    { id: 'commissions', label: `📊 ${t('fintech.commission')}`, show: canCommissions },
  ];

  const activeTabs = tabs.filter((t) => t.show);
  const activeTab = activeTabs.some((t) => t.id === tab) ? tab : activeTabs[0]?.id;

  return (
    <div className="page">
      <PageTitle title={t('fintech.pageTitle')} />
      <PageHeader
        title={t('fintech.pageTitle')}
        subtitle={t('fintech.pageSubtitle')}
      />
      <div className="tab-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {activeTabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius)',
              border: activeTab === t.id ? '2px solid var(--brand)' : '1px solid var(--line)',
              background: activeTab === t.id ? 'var(--brand-soft)' : 'transparent',
              color: activeTab === t.id ? 'var(--brand)' : 'var(--muted)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'savings' && <SavingsTab />}
      {activeTab === 'deposits' && <DepositsTab />}
      {activeTab === 'loans' && <LoanManagement />}
      {activeTab === 'subscription' && <SubscriptionTab />}
      {activeTab === 'commissions' && <CommissionsTab />}
    </div>
  );

  function SavingsTab() {
    const { data: account, loading, error, refetch } = useApi<SavingsAccount>('/savings/me');
    const [amount, setAmount] = useState(10000);
    const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    const handleSubmit = async (kind: 'deposit' | 'withdraw') => {
      if (amount <= 0) { setErr(t('fintech.enterValidAmount')); return; }
      setAction(kind);
      setBusy(true); setMsg(''); setErr('');
      try {
        await api.post(`/savings/${kind}`, { amount });
        setMsg(kind === 'deposit' ? t('fintech.depositSuccessful') : t('fintech.withdrawalSuccessful'));
        refetch();
      } catch (e: any) {
        setErr(e.response?.data?.error?.message || e.response?.data?.message || e.message || t('fintech.actionFailed'));
      } finally {
        setBusy(false);
      }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fintech.savingsBalance')}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)' }}>{formatCurrency(account?.balance ?? 0)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {t('fintech.frozenFD')} {formatCurrency(account?.frozenBalance ?? 0)} · {t('fintech.statusLabel')} {account?.status ?? '-'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="field-label">{t('fintech.amountTZS')}</label>
            <input
              type="number"
              className="input"
              value={amount}
              min={1}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: 180 }}
            />
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {quickAmounts.map((a) => (
                <button key={a} className="btn btn-outline btn-sm" onClick={() => setAmount(a)}>{formatCurrency(a)}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" disabled={busy || action === 'withdraw'} onClick={() => handleSubmit('deposit')}>
                {t('fintech.deposit')}
              </button>
              <button className="btn btn-outline" disabled={busy || action === 'deposit'} onClick={() => handleSubmit('withdraw')}>
                {t('fintech.withdraw')}
              </button>
            </div>
            {msg && <div style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{msg}</div>}
            {err && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{err}</div>}
          </div>
        </div>

        <div>
          <h3 className="section-title">{t('fintech.history')}</h3>
          <TxHistory accountId={account?.id ?? null} />
        </div>
      </div>
    );
  }

  function TxHistory({ accountId }: { accountId: string | null }) {
    const { data: txs, loading, error } = useApi<SavingsTx[]>(accountId ? `/savings/${accountId}/transactions` : null, [accountId]);
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!txs || txs.length === 0) {
      return <EmptyState icon="🏦" title={t('fintech.noTransactionsYet')} sub={t('fintech.depositToGetStarted')} />;
    }
    return (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('fintech.type')}</th>
              <th>{t('fintech.amount')}</th>
              <th>{t('fintech.balanceAfter')}</th>
              <th>{t('fintech.reference')}</th>
              <th>{t('fintech.date')}</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <span className={`badge ${tx.type === 'deposit' ? 'badge-green' : 'badge-amber'}`}>{tx.type}</span>
                </td>
                <td>{formatCurrency(tx.amount)}</td>
                <td>{formatCurrency(tx.balanceAfter)}</td>
                <td>{tx.reference || '-'}</td>
                <td>{formatDate(tx.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function DepositsTab() {
    const { data: account, loading: acctLoading, error: acctError } = useApi<SavingsAccount>('/savings/me');
    const { data: rates } = useApi<Record<string, { rate: number; label: string }>>('/savings/rates');
    const accountId = account?.id ?? null;
    const { data: fds, loading, error, refetch } = useApi<FixedDeposit[]>(accountId ? `/savings/${accountId}/fixed-deposits` : null, [accountId]);
    const [principal, setPrincipal] = useState(50000);
    const [duration, setDuration] = useState(12);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    const rateRows = rates ? Object.entries(rates).sort((a, b) => Number(a[0]) - Number(b[0])) : [];

    const projected = useMemo(() => {
      const rate = rates?.[String(duration)]?.rate ?? 0;
      if (!rate || principal <= 0) return 0;
      return Math.round(principal * Math.pow(1 + rate / 12, duration) * 100) / 100;
    }, [principal, duration, rates]);

    const handleCreate = async () => {
      if (principal <= 0) { setErr(t('fintech.enterValidPrincipal')); return; }
      setBusy(true); setMsg(''); setErr('');
      try {
        await api.post('/savings/fixed-deposits', { principal, durationMonths: duration });
        setMsg(t('fintech.fdCreatedSuccessfully'));
        refetch();
      } catch (e: any) {
        setErr(e.response?.data?.error?.message || e.response?.data?.message || e.message || t('fintech.failedCreateFD'));
      } finally {
        setBusy(false);
      }
    };

    if (acctLoading) return <LoadingSpinner />;
    if (acctError) return <ErrorMessage message={acctError} />;

    return (
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="section-title">{t('fintech.createFixedDeposit')}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="field-label">{t('fintech.principal')}</label>
            <input type="number" className="input" value={principal} min={1} onChange={(e) => setPrincipal(Number(e.target.value))} style={{ width: 160 }} />
            <label className="field-label">{t('fintech.duration')}</label>
            <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ width: 170 }}>
              {rateRows.map(([months, r]) => (
                <option key={months} value={months}>{r.label} — {(r.rate * 100).toFixed(1)}% / yr</option>
              ))}
            </select>
            <button className="btn btn-primary" disabled={busy} onClick={handleCreate}>{t('fintech.createFD')}</button>
          </div>
          {rates && duration != null && rates[String(duration)] && (
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              {t('fintech.projectedMaturityAfter')} {rates[String(duration)].label}:{' '}
              <strong style={{ color: 'var(--ink)' }}>{formatCurrency(projected)}</strong>
              <br />
              {t('fintech.availableBalance')}: <strong style={{ color: 'var(--ink)' }}>{formatCurrency(account?.balance ?? 0)}</strong> {t('fintech.principalFrozen')}
            </div>
          )}
          {msg && <div style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{msg}</div>}
          {err && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{err}</div>}
        </div>

        <div>
          <h3 className="section-title">{t('fintech.myFixedDeposits')}</h3>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : !fds || fds.length === 0 ? (
            <EmptyState icon="🏦" title={t('fintech.noFixedDeposits')} sub={t('fintech.lockSavings')} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('fintech.principal')}</th>
                    <th>{t('fintech.rate')}</th>
                    <th>{t('fintech.duration')}</th>
                    <th>{t('fintech.maturityValue')}</th>
                    <th>{t('fintech.maturesOn')}</th>
                    <th>{t('fintech.statusLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {fds.map((fd) => (
                    <tr key={fd.id}>
                      <td>{formatCurrency(fd.principal)}</td>
                      <td>{(fd.interestRate * 100).toFixed(1)}%</td>
                      <td>{fd.durationMonths} mo</td>
                      <td><strong>{formatCurrency(fd.maturityAmount)}</strong></td>
                      <td>{formatDate(fd.maturityDate)}</td>
                      <td><span className={`badge ${fd.status === 'active' ? 'badge-green' : 'badge-amber'}`}>{fd.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  function SubscriptionTab() {
    const { data: tiers, loading, error } = useApi<SubscriptionTier[]>('/vendor-subscriptions/tiers');
    const { data: mine, refetch } = useApi<{ id: string; status: string; tier?: SubscriptionTier | null; currentPeriodEnd?: string } | null>('/vendor-subscriptions/me');
    const { data: invoices } = useApi<SubscriptionInvoice[] | null>(isVendor ? '/vendor-subscriptions/me/invoices' : null);
    const [busy, setBusy] = useState<string | null>(null);
    const [subError, setSubError] = useState<string | null>(null);

    const handleSubscribe = async (tierId: string) => {
      setBusy(tierId);
      try {
        await api.post('/vendor-subscriptions/subscribe', { tierId });
        refetch();
      } catch (e: any) {
        setBusy(null);
        setSubError(e.response?.data?.error?.message || e.response?.data?.message || e.message || t('fintech.subscriptionFailed'));
      } finally {
        setBusy(null);
      }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {mine && mine.status === 'active' && (
          <div style={{ background: 'var(--brand-soft)', padding: '1rem', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 800, color: 'var(--brand)' }}>⭐ {t('fintech.activeLabel')} {mine.tier?.name ?? t('fintech.subscription')}</div>
            {mine.currentPeriodEnd && <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{t('fintech.renews')} {formatDate(mine.currentPeriodEnd)}</div>}
          </div>
        )}
        {invoices && invoices.length > 0 && (
          <div>
            <div style={{ fontWeight: 800, marginBottom: '0.75rem' }}>🧾 {t('fintech.invoices')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {invoices.map((inv) => (
                <div key={inv.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(inv.amount)} <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{inv.currency}</span></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fintech.due')} {formatDate(inv.dueDate)}</div>
                  </div>
                  <span className={`badge ${inv.status === 'paid' ? 'badge-green' : inv.status === 'pending' ? '' : 'badge-red'}`} style={{ textTransform: 'capitalize' }}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {tiers?.map((tier) => (
            <div key={tier.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '1.1rem' }}>{tier.name}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)' }}>
                {tier.monthlyPrice === 0 ? t('fintech.bure') : formatCurrency(tier.monthlyPrice)}
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fintech.perMonth')}</span>
              </div>
              {tier.commissionRateOverride != null && (
                <div className="badge badge-green" style={{ alignSelf: 'flex-start' }}>{t('fintech.commission')} {(tier.commissionRateOverride * 100).toFixed(0)}%</div>
              )}
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {(tier.features || []).map((f, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{f}</li>
                ))}
              </ul>
              <button
                className="btn btn-primary"
                disabled={busy !== null || mine?.tier?.id === tier.id}
                onClick={() => handleSubscribe(tier.id)}
              >
                {mine?.tier?.id === tier.id ? t('fintech.current') : t('fintech.subscribe')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function CommissionsTab() {
    const { data: records, loading, error } = useApi<CommissionRecord[]>('/commissions/me');
    const { data: summary } = useApi<{ totalCommission: number; totalTransactions: number } | null>(isAdmin ? '/commissions/summary' : null);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    const totalCommission = records?.reduce((sum, r) => sum + r.commissionAmount, 0) ?? 0;

    return (
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {isAdmin && summary && (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fintech.tenantTotalCommission')}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>{formatCurrency(summary.totalCommission)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fintech.transactions')}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>{summary.totalTransactions}</div>
            </div>
          </div>
        )}
        {!isAdmin && (
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fintech.myTotalCommission')}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>{formatCurrency(totalCommission)}</div>
          </div>
        )}
        {!records || records.length === 0 ? (
          <EmptyState icon="📊" title={t('fintech.noCommissionRecords')} sub={t('fintech.commissionAppearHere')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('fintech.orderLabel')}</th>
                  <th>{t('fintech.payer')}</th>
                  <th>{t('fintech.orderAmount')}</th>
                  <th>{t('fintech.rate')}</th>
                  <th>{t('fintech.commissionLabel')}</th>
                  <th>{t('fintech.statusLabel')}</th>
                  <th>{t('fintech.date')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.orderId.slice(0, 8)}…</td>
                    <td>{r.payerType}</td>
                    <td>{formatCurrency(r.orderAmount)}</td>
                    <td>{(r.commissionRate * 100).toFixed(0)}%</td>
                    <td><strong>{formatCurrency(r.commissionAmount)}</strong></td>
                    <td><span className="badge badge-amber">{r.status}</span></td>
                    <td>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
}
