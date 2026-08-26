import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/ui';

interface KycStatus {
  status: string;
  nidaNumber?: string;
  verifiedAt?: string;
}

export default function CustomerKyc() {
  const { t } = useTranslation();
  const [kyc, setKyc] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [nidaNumber, setNidaNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/kyc/me')
      .then(res => {
        const data = res.data?.data?.data ?? res.data?.data ?? null;
        setKyc(data);
        if (data?.nidaNumber) setNidaNumber(data.nidaNumber);
      })
      .catch(() => setKyc(null))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!nidaNumber || nidaNumber.length < 10) { setError(t('kyc.invalidNida')); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await api.post('/kyc/submit', {
        partnerType: 'MARKET_CAPTAIN',
        nidaNumber,
      });
      setKyc(result.data?.data ?? result.data);
    } catch (err) {
      setError((err as Error).message || t('kyc.submissionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page page-narrow">
      <PageHeader title={t('kyc.title')} sub={t('kyc.subtitle')} />

      {kyc?.status === 'APPROVED' ? (
        <div className="alert alert-success" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
          <strong>{t('kyc.verified')}</strong>
          {kyc.verifiedAt && <div className="text-muted" style={{ marginTop: '0.25rem' }}>{t('kyc.verifiedDate', { date: new Date(kyc.verifiedAt).toLocaleDateString() })}</div>}
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem' }}>
          {kyc?.status && (
            <div className="alert alert-warning mb-1">{t('kyc.statusLabel')}: <strong>{kyc.status}</strong></div>
          )}
          {error && <div className="alert alert-error mb-1">{error}</div>}
          <div className="field">
            <label className="field-label">{t('kyc.nidaNumber')}</label>
            <input
              className="input"
              value={nidaNumber}
              onChange={e => setNidaNumber(e.target.value)}
              placeholder={t('kyc.nidaPlaceholder')}
            />
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? t('kyc.submitting') : t('kyc.submitForVerification')}
          </button>
        </div>
      )}
    </div>
  );
}
