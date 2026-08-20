import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useCurrency } from '../../context/CurrencyContext';

interface Loan {
  id: string;
  borrowerType: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  collateral?: string;
  purpose?: string;
  status: string;
  approvedAt?: string;
  disbursedAt?: string;
  dueDate?: string;
  createdAt: string;
}

interface LoanStats {
  pending: number;
  approved: number;
  active: number;
  paid: number;
  totalDisbursed: number;
  outstanding: number;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'active' | 'paid' | 'rejected';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  active: 'Active',
  paid: 'Paid',
  defaulted: 'Defaulted',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#b45309',
  approved: 'var(--info)',
  active: '#059669',
  paid: '#059669',
  defaulted: 'var(--danger)',
  rejected: 'var(--danger)',
};

const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString() : '—';

export default function AdminLoans() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/fintech/loans/admin?status=${filter}`).then(r => r.data?.data ?? r.data),
      api.get('/fintech/loans/admin/stats').then(r => r.data?.data ?? r.data),
    ])
      .then(([loanData, statsData]) => {
        setLoans(Array.isArray(loanData) ? loanData : []);
        setStats(statsData);
      })
      .catch((e) => setError(e?.response?.data?.message ?? 'Failed to load loans'))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'approve' | 'disburse') => {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/fintech/loans/${id}/${action}`);
      load();
    } catch (e) {
      setError(e?.response?.data?.message ?? `Failed to ${action} loan`);
    } finally {
      setBusyId(null);
    }
  };

  const card = (title: string, value: string, sub?: string) => (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink-soft)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--faint)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Loan Management</h2>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(['all', 'pending', 'approved', 'active', 'paid'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: filter === f ? 'var(--ink-soft)' : '#fff',
                color: filter === f ? '#fff' : 'var(--text)',
                cursor: 'pointer',
                fontWeight: filter === f ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {card('Pending', String(stats.pending))}
          {card('Approved', String(stats.approved))}
          {card('Active', String(stats.active))}
          {card('Paid', String(stats.paid))}
          {card('Total Disbursed', formatCurrency(stats.totalDisbursed))}
          {card('Outstanding', formatCurrency(stats.outstanding))}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading loans...</div>
      ) : loans.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: 'var(--faint)' }}>
          No {filter === 'all' ? '' : STATUS_LABELS[filter].toLowerCase() + ' '}loans found.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Borrower</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Principal</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Monthly</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Term</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Balance</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Applied</th>
                <th style={{ padding: '0.5rem' }}>Due</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{l.borrowerType}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--faint)' }}>{(l.id || '').slice(0, 8)}</div>
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(l.principal)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(l.monthlyPayment)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{l.termMonths} mo</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(l.remainingBalance)}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ color: STATUS_COLORS[l.status] || 'var(--text)', fontWeight: 600, textTransform: 'capitalize' }}>
                      {STATUS_LABELS[l.status] ?? l.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{formatDate(l.createdAt)}</td>
                  <td style={{ padding: '0.5rem' }}>{formatDate(l.dueDate)}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {l.status === 'pending' && (
                      <button
                        onClick={() => act(l.id, 'approve')}
                        disabled={busyId === l.id}
                        style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', background: 'var(--info)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Approve
                      </button>
                    )}
                    {l.status === 'approved' && (
                      <button
                        onClick={() => act(l.id, 'disburse')}
                        disabled={busyId === l.id}
                        style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Disburse
                      </button>
                    )}
                    {busyId === l.id && <span style={{ marginLeft: '0.5rem', color: 'var(--faint)', fontSize: '0.8rem' }}>Working...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
