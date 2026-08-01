import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useCurrency } from '../../context/CurrencyContext';

interface ReconciliationReport {
  period: string;
  since: string;
  commissions: {
    totalCommission: number;
    totalVendorNet: number;
    totalDriverNet: number;
    paymentCount: number;
    settledCount: number;
  };
  wallets: Array<{
    ownerType: string;
    walletCount: number;
    totalBalance: number;
    totalPending: number;
  }>;
  transactions: {
    totalCredits: number;
    totalDebits: number;
    txCount: number;
  };
  pendingPayouts: Array<{
    ownerId: string;
    ownerType: string;
    balance: number;
  }>;
}

export default function AdminReconciliation() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d'>('30d');
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatCurrency, currency } = useCurrency();

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/finance/reconciliation?period=${period}`)
      .then(res => setReport(res.data?.data ?? res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const card = (title: string, value: string, sub?: string) => (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading report...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Reconciliation Report</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['today', '7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: period === p ? '#1e293b' : '#fff',
                color: period === p ? '#fff' : '#334155',
                cursor: 'pointer',
                fontWeight: period === p ? 600 : 400,
              }}
            >
              {p === 'today' ? 'Today' : p}
            </button>
          ))}
        </div>
      </div>

      {report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {card('Commission Earned', formatCurrency(report.commissions.totalCommission), `${report.commissions.paymentCount} payments`)}
            {card('Vendor Net', formatCurrency(report.commissions.totalVendorNet))}
            {card('Driver Net', formatCurrency(report.commissions.totalDriverNet))}
            {card('Settled Payments', `${report.commissions.settledCount} / ${report.commissions.paymentCount}`, `${report.commissions.paymentCount - report.commissions.settledCount} pending`)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {report.wallets.map(w => (
              card(
                `${w.ownerType.charAt(0).toUpperCase() + w.ownerType.slice(1)} Wallets`,
                formatCurrency(w.totalBalance),
                `${w.walletCount} wallets, ${formatCurrency(w.totalPending)} pending`
              )
            ))}
            {card('Transaction Volume', formatCurrency(report.transactions.totalCredits), `${report.transactions.txCount} transactions`)}
          </div>

          {report.pendingPayouts.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem' }}>Pending Payouts ({report.pendingPayouts.length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Owner</th>
                    <th style={{ padding: '0.5rem' }}>Type</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Balance ({currency.code})</th>
                  </tr>
                </thead>
                <tbody>
                  {report.pendingPayouts.map((p, i) => (
                    <tr key={p.ownerId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.ownerId.slice(0, 12)}...</td>
                      <td style={{ padding: '0.5rem' }}>{p.ownerType}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{p.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
