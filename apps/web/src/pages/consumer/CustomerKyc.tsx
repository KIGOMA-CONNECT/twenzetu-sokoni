import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

interface KycStatus {
  status: string;
  nidaNumber?: string;
  verifiedAt?: string;
}

export default function CustomerKyc() {
  const [kyc, setKyc] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [nidaNumber, setNidaNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { get, post } = useApi();

  useEffect(() => {
    get<KycStatus>('/kyc/me')
      .then(data => { setKyc(data); if (data.nidaNumber) setNidaNumber(data.nidaNumber); })
      .catch(() => setKyc(null))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!nidaNumber || nidaNumber.length < 10) { setError('Enter a valid NIDA number'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await post('/kyc/submit', {
        partnerType: 'MARKET_CAPTAIN',
        nidaNumber,
      });
      setKyc(result);
    } catch (err) {
      setError((err as Error).message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>Identity Verification</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Verify your identity to unlock higher order limits and faster dispute resolution.
      </p>

      {kyc?.status === 'APPROVED' ? (
        <div style={{ background: '#f0fdf4', color: '#166534', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
          <strong>Identity Verified</strong>
          {kyc.verifiedAt && <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Verified {new Date(kyc.verifiedAt).toLocaleDateString()}</div>}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {kyc?.status && (
            <div style={{ background: '#fefce8', color: '#a16207', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Status: <strong>{kyc.status}</strong>
            </div>
          )}
          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>NIDA Number</label>
            <input
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
              value={nidaNumber}
              onChange={e => setNidaNumber(e.target.value)}
              placeholder="National ID number"
            />
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            style={{
              width: '100%', padding: '0.6rem', border: 'none', borderRadius: '6px',
              background: submitting ? '#94a3b8' : '#3b82f6', color: '#fff',
              fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      )}
    </div>
  );
}
