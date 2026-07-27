import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { Wallet, WalletTransaction } from '../../types';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.5rem 0' },
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
  credit: { color: '#16a34a' },
  debit: { color: '#dc2626' },
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export default function WalletPage() {
  const { formatCurrency, currency } = useCurrency();
  const { data: wallet, loading, error } = useApi<Wallet>('/wallets/me');
  const { data: transactions, loading: txLoading, error: txError } = useApi<WalletTransaction[]>('/wallets/transactions');

  if (loading) return <div style={styles.container}><LoadingSpinner /></div>;
  if (error) return <div style={styles.container}><ErrorMessage message={error} /></div>;

  if (!wallet) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>My Wallet</h1>
        <div style={styles.noWallet}>
          <div style={styles.noWalletIcon}>💰</div>
          <div style={styles.noWalletText}>No wallet found</div>
          <div style={styles.noWalletSub}>Your wallet will be created after your first transaction.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Wallet</h1>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Available Balance</div>
          <div style={styles.statValue}>{formatCurrency(wallet.balance)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Pending Balance</div>
          <div style={{ ...styles.statValue, ...styles.pendingValue }}>{formatCurrency(wallet.pendingBalance)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Currency</div>
          <div style={styles.statValue}>{wallet.currency || currency.code}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Recent Transactions</div>
        {txLoading ? (
          <LoadingSpinner />
        ) : txError ? (
          <div style={{ padding: '1rem' }}><ErrorMessage message={txError} /></div>
        ) : !transactions || transactions.length === 0 ? (
          <div style={styles.empty}>No transactions yet.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Balance After</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
