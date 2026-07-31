import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import api from '../../api/client';
import type { Wallet, WalletTransaction } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statLabel: { fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { fontSize: '1.75rem', fontWeight: 700, color: '#1e40af', marginTop: '0.5rem' },
  pendingValue: { color: '#f59e0b' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  empty: { textAlign: 'center', color: '#64748b', padding: '2rem' },
  noWallet: { textAlign: 'center', color: '#64748b', padding: '3rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' },
  noWalletIcon: { fontSize: '2rem', marginBottom: '0.75rem' },
  noWalletText: { fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' },
  noWalletSub: { fontSize: '0.875rem', color: '#64748b' },
  btn: { padding: '0.6rem 1.25rem', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' },
  btnPrimary: { background: '#1e40af', color: '#fff' },
  btnOutline: { background: 'transparent', color: '#1e40af', border: '2px solid #1e40af' },
  btnDanger: { background: '#dc2626', color: '#fff' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem', display: 'block' },
  input: { width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' as const },
  inputGroup: { marginBottom: '1rem' },
  methodCard: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem' },
  methodCardActive: { borderColor: '#1e40af', background: '#eff6ff' },
  methodIcon: { fontSize: '1.5rem' },
  methodName: { fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' },
  methodDesc: { fontSize: '0.8rem', color: '#64748b' },
  modalActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' },
  successMsg: { background: '#f0fdf4', color: '#16a34a', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' as const },
  errorMsg: { background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' as const },
};

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

  if (loading) return <div style={styles.container}><LoadingSpinner /></div>;
  if (error) return <div style={styles.container}><ErrorMessage message={error} /></div>;

  if (!wallet) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>{t('wallet.title')}</h1>
        <div style={styles.noWallet}>
          <div style={styles.noWalletIcon}>💰</div>
          <div style={styles.noWalletText}>{t('wallet.title')}</div>
          <div style={styles.noWalletSub}>{t('common.noData')}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        {t('wallet.title')}
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => { setTopupAmount(10000); setPhoneNumber(''); setTopupSuccess(''); setTopupError(''); setShowTopup(true); }}>
          + {t('wallet.topUp')}
        </button>
      </h1>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>{t('wallet.balance')}</div>
          <div style={styles.statValue}>{formatCurrency(wallet.balance)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>{t('wallet.pending')}</div>
          <div style={{ ...styles.statValue, ...styles.pendingValue }}>{formatCurrency(wallet.pendingBalance)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Currency</div>
          <div style={styles.statValue}>{wallet.currency || currency.code}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>{t('wallet.transactions')}</div>
        {txLoading ? (
          <LoadingSpinner />
        ) : txError ? (
          <div style={{ padding: '1rem' }}><ErrorMessage message={txError} /></div>
        ) : !transactions || transactions.length === 0 ? (
          <div style={styles.empty}>{t('wallet.noTransactions')}</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Balance After</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={styles.td}>{tx.type}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: tx.type === 'CREDIT' ? '#16a34a' : '#dc2626' }}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td style={styles.td}>{tx.description}</td>
                  <td style={styles.td}>{formatCurrency(tx.balanceAfter)}</td>
                  <td style={styles.td}>{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showTopup && (
        <div style={styles.modalOverlay} onClick={() => setShowTopup(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{t('wallet.topUpTitle')}</div>

            {topupSuccess && <div style={styles.successMsg}>{topupSuccess}</div>}
            {topupError && <div style={styles.errorMsg}>{topupError}</div>}

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('wallet.amount')}</label>
              <input
                style={styles.input}
                type="number"
                min="100"
                step="100"
                value={topupAmount}
                onChange={(e) => setTopupAmount(Number(e.target.value))}
                placeholder="Enter amount"
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    style={{
                      ...styles.btn,
                      ...(topupAmount === a ? styles.btnPrimary : styles.btnOutline),
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                    }}
                    onClick={() => setTopupAmount(a)}
                  >
                    {formatCurrency(a)}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('wallet.phoneNumber')}</label>
              <input
                style={styles.input}
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0712345678 or +255712345678"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>{t('product.paymentMethod')}</label>
              {paymentMethods.map((m) => (
                <div
                  key={m.id}
                  style={{ ...styles.methodCard, ...(selectedMethod === m.id ? styles.methodCardActive : {}) }}
                  onClick={() => setSelectedMethod(m.id)}
                >
                  <span style={styles.methodIcon}>{m.icon}</span>
                  <div>
                    <div style={styles.methodName}>{m.name}</div>
                    <div style={styles.methodDesc}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.modalActions}>
              <button style={{ ...styles.btn, ...styles.btnOutline }} onClick={() => setShowTopup(false)} disabled={submitting}>
                {t('common.cancel')}
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnPrimary, opacity: submitting ? 0.6 : 1 }}
                onClick={handleTopup}
                disabled={submitting || !topupAmount || topupAmount < 100 || !phoneNumber}
              >
                {submitting ? 'Processing...' : `Top Up ${formatCurrency(topupAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
