import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import api from '../../api/client';

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
    const colors: Record<string, string> = { PENDING: 'amber', COMPLETED: 'green', EXPIRED: 'red' };
    const label = colors[status] || 'slate';
    return <span className={`badge badge-${label}`}>{status}</span>;
  };

  return (
    <div className="page">
      <PageHeader
        title="Refer a Friend"
        sub="Invite friends to join afriMarket and earn wallet credits when they place their first order"
      />

      {genError && <ErrorMessage message={genError} />}

      {!referralCode && !codeLoading && (
        <div className="card" style={{ maxWidth: 520 }}>
          <h3 className="card-title">Get Your Referral Code</h3>
          <div className="field">
            <label className="field-label">Custom Code (optional, 6-20 characters)</label>
            <input
              className="input"
              value={customCode}
              onChange={e => setCustomCode(e.target.value.toUpperCase())}
              placeholder="e.g. MAMA2024"
              maxLength={20}
            />
          </div>
          <button className="btn btn-primary" onClick={generateCode} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Referral Code'}
          </button>
        </div>
      )}

      {referralCode && (
        <>
          <div className="grid grid-2">
            <div className="stat-card">
              <div className="stat-label">Total Referrals</div>
              <div className="stat-value">{stats?.total_referrals || 0}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{stats?.completed_referrals || 0}</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Earned</div>
              <div className="stat-value">{formatCurrency(stats?.total_earned || 0)}</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-label">Pending Rewards</div>
              <div className="stat-value">{formatCurrency(stats?.pending_rewards || 0)}</div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Your Referral Code</h3>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              background: 'var(--success-soft)', border: '2px dashed var(--success)',
              borderRadius: 'var(--radius)', padding: '1rem 1.5rem', marginTop: '0.5rem',
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: 3, color: 'var(--success)', fontFamily: 'monospace' }}>
                {referralCode}
              </span>
              <button className="btn btn-success" onClick={copyToClipboard}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            {copied && <div className="text-brand" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Link copied to clipboard!</div>}
            {shareLink && (
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.75rem' }}>
                Share link: <code style={{ wordBreak: 'break-all' }}>{shareLink}</code>
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Your Referrals</h3>
            {refLoading && <LoadingSpinner />}
            {refError && <ErrorMessage message={refError} />}
            {!refLoading && !refError && (!referrals || referrals.length === 0) && (
              <EmptyState icon="👥" title="No referrals yet" sub="Share your code to start earning!" />
            )}
            {!refLoading && referrals && referrals.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Reward</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref: any) => (
                      <tr key={ref.id}>
                        <td>{ref.referred_phone || ref.referred_name || '-'}</td>
                        <td>{statusBadge(ref.status)}</td>
                        <td>{formatCurrency(Number(ref.reward_amount) || 0)}</td>
                        <td>{new Date(ref.created_at).toLocaleDateString()}</td>
                        <td>
                          {ref.status === 'COMPLETED' && !ref.reward_claimed && (
                            <button className="btn btn-primary btn-sm" onClick={() => claimReward(ref.id)}>
                              Claim
                            </button>
                          )}
                          {ref.reward_claimed && <span className="text-brand text-bold" style={{ fontSize: '0.85rem' }}>Claimed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {codeLoading && <LoadingSpinner />}
    </div>
  );
}
