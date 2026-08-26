import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-soft)', margin: 0 },
  subheader: { color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.25rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', padding: '1.5rem', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid var(--line)', color: 'var(--text)' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer' },
  approveBtn: { background: 'var(--success)', color: '#fff' },
  rejectBtn: { background: 'var(--surface)', color: 'var(--danger)', border: '1px solid #dc2626' },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '2rem' },
  riskLow: { color: '#166534' },
  riskMed: { color: '#b45309' },
  riskHigh: { color: 'var(--danger)' },
  reason: { fontSize: '0.8rem', color: 'var(--muted)', maxWidth: '220px' },
};

function RiskScore({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return <span>-</span>;
  const style = score >= 60 ? styles.riskHigh : score >= 30 ? styles.riskMed : styles.riskLow;
  return <span style={{ fontWeight: 600, ...style }}>{score}/100</span>;
}

export default function AdminVerifications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: verifications, loading, error, refetch } = useApi<User[]>('/auth/admin/verifications');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setActionError(null);
    try {
      await api.post(`/auth/admin/verifications/${id}/approve`);
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      setActionError(t('admin.pleaseProvideRejectionReason'));
      return;
    }
    setActionLoading(id);
    setActionError(null);
    try {
      await api.post(`/auth/admin/verifications/${id}/reject`, { reason: rejectReason.trim() });
      setRejectingId(null);
      setRejectReason('');
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <h1 style={styles.header}>{t('admin.verificationQueue')}</h1>
        <div style={styles.subheader}>{t('admin.reviewApproveRegistrations', { name: user?.fullName || 'Admin' })}</div>
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {error && <ErrorMessage message={error} />}

      <div style={styles.card}>
        {loading ? (
          <LoadingSpinner />
        ) : verifications && verifications.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('admin.name')}</th>
                <th style={styles.th}>{t('admin.role')}</th>
                <th style={styles.th}>{t('admin.phone')}</th>
                <th style={styles.th}>{t('admin.business')}</th>
                <th style={styles.th}>{t('admin.idRegNo')}</th>
                <th style={styles.th}>{t('admin.city')}</th>
                <th style={styles.th}>{t('admin.risk')}</th>
                <th style={styles.th}>{t('admin.status')}</th>
                <th style={styles.th}>{t('admin.reasonLabel')}</th>
                <th style={styles.th}>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.id}>
                  <td style={styles.td}>{v.fullName}</td>
                  <td style={styles.td}><StatusBadge status={v.role} /></td>
                  <td style={styles.td}>{v.phoneNumber}</td>
                  <td style={styles.td}>{v.businessName || '-'}</td>
                  <td style={styles.td}>{v.ninOrRegNo || '-'}</td>
                  <td style={styles.td}>{v.city || '-'}</td>
                  <td style={styles.td}><RiskScore score={v.verificationRiskScore} /></td>
                  <td style={styles.td}><StatusBadge status={v.status} /></td>
                  <td style={styles.td}><span style={styles.reason}>{v.rejectionReason || '-'}</span></td>
                  <td style={styles.td}>
                    {rejectingId === v.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '200px' }}>
                        <input
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder={t('admin.rejectionReason')}
                        />
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            style={{ ...styles.btn, ...styles.rejectBtn, ...(actionLoading === v.id ? styles.disabledBtn : {}) }}
                            onClick={() => handleReject(v.id)}
                            disabled={actionLoading === v.id}
                          >
                            {actionLoading === v.id ? t('admin.rejecting') : t('admin.confirm')}
                          </button>
                          <button
                            style={{ ...styles.btn, ...styles.rejectBtn }}
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          style={{ ...styles.btn, ...styles.approveBtn, ...(actionLoading === v.id ? styles.disabledBtn : {}) }}
                          onClick={() => handleApprove(v.id)}
                          disabled={actionLoading === v.id}
                        >
                          {t('admin.approve')}
                        </button>
                        <button
                          style={{ ...styles.btn, ...styles.rejectBtn }}
                          onClick={() => { setRejectingId(v.id); setRejectReason(''); }}
                        >
                          {t('admin.reject')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.empty}>{t('admin.noPendingVerifications')}</div>
        )}
      </div>
    </div>
  );
}
