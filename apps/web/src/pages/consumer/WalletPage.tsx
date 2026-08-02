import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import api from '../../api/client';
import type { Wallet, WalletTransaction } from '../../types';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const paymentMethods = [
  { id: 'mpesa', icon: '📱', name: 'M-Pesa', desc: 'Vodacom Tanzania' },
  { id: 'tigo_pesa', icon: '📱', name: 'Tigo Pesa', desc: 'Tigo Tanzania' },
  { id: 'airtel_money', icon: '📱', name: 'Airtel Money', desc: 'Airtel Tanzania' },
];

const quickAmounts = [5000, 10000, 20000, 50000, 100000, 200000];

export default function WalletPage() {
  const { t } = useTranslation();
  const { formatCurrency, currency } = useCurrency();
  const { data: wallet, loading, error, refetch: refetchWallet } = useApi<Wallet>('/wallets/me');
  const { data: transactions, loading: txLoading, error: txError, refetch: refetchTx } = useApi<WalletTransaction[]>('/wallets/transactions');

  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10000);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [submitting, setSubmitting] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState('');
  const [topupError, setTopupError] = useState('');

  const handleTopup = async () => {
    setSubmitting(true);
    setTopupSuccess('');
    setTopupError('');
    try {
      const res = await api.post('/wallets/top-up', { amount: topupAmount, phoneNumber });
      if (res.data?.data?.success) {
        setTopupSuccess('M-Pesa prompt sent to your phone. Confirm to complete top-up.');
        setTimeout(() => {
          setShowTopup(false);
          refetchWallet();
          refetchTx();
        }, 3000);
      } else {
        setTopupError(res.data?.data?.message || res.data?.message || 'Top-up failed');
      }
    } catch (err: any) {
      setTopupError(err.response?.data?.error?.message || err.message || 'Failed to initiate top-up');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><LoadingSpinner /></div>;
  if (error) return <div className="page"><ErrorMessage message={error} /></div>;

  if (!wallet) {
    return (
      <div className="page">
        <PageHeader title={t('wallet.title')} />
        <EmptyState icon="💰" title={t('wallet.title')} sub={t('common.noData')} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={t('wallet.title')}
        action={
          <button className="btn btn-accent" onClick={() => { setTopupAmount(10000); setPhoneNumber(''); setTopupSuccess(''); setTopupError(''); setShowTopup(true); }}>
            + {t('wallet.topUp')}
          </button>
        }
      />

      <div className="grid grid-2 mb-3">
        <div className="stat-card">
          <div className="stat-label">{t('wallet.balance')}</div>
          <div className="stat-value">{formatCurrency(wallet.balance)}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">{t('wallet.pending')}</div>
          <div className="stat-value">{formatCurrency(wallet.pendingBalance)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Currency</div>
          <div className="stat-value">{wallet.currency || currency.code}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>🧾 {t('wallet.transactions')}</h2>
        </div>
        {txLoading ? (
          <LoadingSpinner />
        ) : txError ? (
          <div style={{ padding: '1rem' }}><ErrorMessage message={txError} /></div>
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState icon="🧾" title={t('wallet.noTransactions')} />
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Balance After</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className={`badge ${tx.type === 'CREDIT' ? 'badge-green' : 'badge-red'}`}>{tx.type}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: tx.type === 'CREDIT' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ color: 'var(--text)' }}>{tx.description}</td>
                    <td style={{ color: 'var(--text)' }}>{formatCurrency(tx.balanceAfter)}</td>
                    <td style={{ color: 'var(--muted)' }}>{formatDate(tx.createdAt ?? '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showTopup && (
        <div className="modal-overlay" onClick={() => setShowTopup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">💳 {t('wallet.topUpTitle')}</div>

            {topupSuccess && <div className="alert alert-success mb-1">✅ {topupSuccess}</div>}
            {topupError && <div className="alert alert-error mb-1">⚠️ {topupError}</div>}

            <div className="field">
              <label className="field-label">{t('wallet.amount')}</label>
              <input className="input" type="number" min="100" step="100" value={topupAmount} onChange={(e) => setTopupAmount(Number(e.target.value))} placeholder="Enter amount" />
              <div className="flex gap-1 wrap mt-1">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    className={`btn btn-sm ${topupAmount === a ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setTopupAmount(a)}
                  >
                    {formatCurrency(a)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('wallet.phoneNumber')}</label>
              <input className="input" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 0712345678 or +255712345678" />
            </div>

            <div className="field">
              <label className="field-label">{t('product.paymentMethod')}</label>
              {paymentMethods.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem',
                    border: selectedMethod === m.id ? '2px solid var(--brand)' : '2px solid var(--line)',
                    borderRadius: 'var(--radius)', cursor: 'pointer', marginBottom: '0.5rem',
                    background: selectedMethod === m.id ? 'var(--brand-soft)' : '#fff',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowTopup(false)} disabled={submitting}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleTopup} disabled={submitting || !topupAmount || topupAmount < 100 || !phoneNumber}>
                {submitting ? 'Processing...' : `Top Up ${formatCurrency(topupAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
