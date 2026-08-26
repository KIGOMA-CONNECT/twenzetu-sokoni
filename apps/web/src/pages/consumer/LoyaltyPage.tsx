import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';

export default function LoyaltyPage() {
  const { t } = useTranslation();
  const { data, loading, error } = useApi<any>('/loyalty/me');
  const loyalty = data?.data ?? data;

  if (loading) return <div className="page"><LoadingSpinner /></div>;
  if (error) return <div className="page"><ErrorMessage message={error} /></div>;

  if (!loyalty || (loyalty.totalPoints === 0 && loyalty.redeemablePoints === 0)) {
    return (
      <div className="page">
        <PageHeader title={t('loyalty.title')} />
        <EmptyState icon="⭐" title={t('loyalty.noData')} sub={t('loyalty.noDataSub')} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title={t('loyalty.title')} />

      <div className="grid grid-2">
        <div className="stat-card">
          <div className="stat-label">{t('loyalty.availablePoints')}</div>
          <div className="stat-value">{loyalty.redeemablePoints} ⭐</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">{t('loyalty.currentTier')}</div>
          <div className="stat-value">{loyalty.tier || 'BRONZE'}</div>
        </div>
        <div className="stat-card violet">
          <div className="stat-label">{t('loyalty.totalPointsEarned')}</div>
          <div className="stat-value">{loyalty.totalPoints}</div>
        </div>
      </div>
    </div>
  );
}
