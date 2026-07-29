import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import api from '../../api/client';

const styles = {
  page: { padding: '1.5rem', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', color: '#0f172a' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, margin: 0 },
  subtext: { color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statBox: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' as const },
  statLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: '#0f766e', marginTop: '0.5rem' },
  codeBox: { display: 'flex', alignItems: 'center', gap: '1rem', background: '#f0fdf4', border: '2px dashed #22c55e', borderRadius: '8px', padding: '1rem 1.5rem', marginTop: '1rem' },
  code: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '3px', color: '#166534', fontFamily: 'monospace' as const },
  btn: { padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },
  primaryBtn: { background: '#0f766e', color: '#fff' },
  secondaryBtn: { background: '#fff', color: '#0f766e', border: '1px solid #0f766e' },
  greenBtn: { background: '#22c55e', color: '#fff' },
  copiedToast: { background: '#166534', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.9rem' },
  th: { textAlign: 'left' as const, padding: '0.75rem 0.5rem', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' as const },
  td: { padding: '0.75rem 0.5rem', borderBottom: '1px solid #e2e8f0' },
  badge: { padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
  input: { padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' as const },
  label: { display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.9rem' },
};

export default function ReferralPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { data: codeData, loading: codeLoading, refetch: refetchCode } = useApi<{ referralCode: string | null }>('/referrals/code');
  const { data: referrals, loading: refLoading, error: refError, refetch: refetchReferrals } = useApi<any[]>('/referrals');
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useApi<any>('/referrals/stats');

  const [customCode, setCustomCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genError, setGenError] = useState('');

  const referralCode = codeData?.referralCode;
  const shareLink = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : '';

  const generateCode = async () => {
    setGenerating(true);
    setGenError('');
    try {
      await api.post('/referrals/generate', { customCode: customCode || undefined });
      await refetchCode();
    } catch (err: any) {
      setGenError(err.response?.data?.message || err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const claimReward = async (referralId: string) => {
    try {
      await api.post('/referrals/claim', { referralId });
      await refetchReferrals();
      await refetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      COMPLETED: '#22c55e',
      EXPIRED: '#ef4444',
    };
    return <span style={{ ...styles.badge, background: colors[status] || '#94a3b8', color: '#fff' }}>{status}</span>;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Refer a Friend</h1>
        <div style={styles.subtext}>Invite friends to join afriMarket and earn wallet credits when they place their first order</div>
      </div>

      {genError && <ErrorMessage message={genError} />}

      {!referralCode && !codeLoading && (
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Get Your Referral Code</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Custom Code (optional, 6-20 characters)</label>
            <input
              style={styles.input}
              value={customCode}
              onChange={e => setCustomCode(e.target.value.toUpperCase())}
              placeholder="e.g. MAMA2024"
              maxLength={20}
            />
          </div>
          <button
            style={{ ...styles.btn, ...styles.primaryBtn }}
            onClick={generateCode}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Referral Code'}
          </button>
        </div>
      )}

      {referralCode && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Total Referrals</div>
              <div style={styles.statValue}>{stats?.total_referrals || 0}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Completed</div>
              <div style={styles.statValue}>{stats?.completed_referrals || 0}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Earned</div>
              <div style={styles.statValue}>{formatCurrency(stats?.total_earned || 0)}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Pending Rewards</div>
              <div style={styles.statValue}>{formatCurrency(stats?.pending_rewards || 0)}</div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Your Referral Code</h3>
            <div style={styles.codeBox}>
              <span style={styles.code}>{referralCode}</span>
              <button style={{ ...styles.btn, ...styles.greenBtn }} onClick={copyToClipboard}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            {copied && <div style={styles.copiedToast}>Link copied to clipboard!</div>}
            {shareLink && (
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.75rem' }}>
                Share link: <code style={{ wordBreak: 'break-all' }}>{shareLink}</code>
              </p>
            )}
          </div>

          <div style={styles.card}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Your Referrals</h3>
            {refLoading && <LoadingSpinner />}
            {refError && <ErrorMessage message={refError} />}
            {!refLoading && !refError && (!referrals || referrals.length === 0) && (
              <p style={{ color: '#64748b' }}>No referrals yet. Share your code to start earning!</p>
            )}
            {!refLoading && referrals && referrals.length > 0 && (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Reward</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref: any) => (
                    <tr key={ref.id}>
                      <td style={styles.td}>{ref.referred_phone || ref.referred_name || '-'}</td>
                      <td style={styles.td}>{statusBadge(ref.status)}</td>
                      <td style={styles.td}>{formatCurrency(Number(ref.reward_amount) || 0)}</td>
                      <td style={styles.td}>{new Date(ref.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        {ref.status === 'COMPLETED' && !ref.reward_claimed && (
                          <button
                            style={{ ...styles.btn, ...styles.primaryBtn, fontSize: '0.8rem' }}
                            onClick={() => claimReward(ref.id)}
                          >
                            Claim
                          </button>
                        )}
                        {ref.reward_claimed && <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.85rem' }}>Claimed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {codeLoading && <LoadingSpinner />}
    </div>
  );
}
