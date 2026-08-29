import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import AiAssistant from '../../components/AiAssistant';
import { PageHeader, EmptyState } from '../../components/ui';

export default function LoyaltyPage() {
  const { t } = useTranslation();
  const { data, loading, error } = useApi<any>('/loyalty/me');
  const loyalty = data?.data ?? data;

  const loyaltyContext = useMemo(() => {
    const facts: Record<string, unknown> = {
      redeemablePoints: loyalty?.redeemablePoints ?? 0,
      totalPoints: loyalty?.totalPoints ?? 0,
      tier: loyalty?.tier ?? 'BRONZE',
    };
    return { summary: `Loyalty — ${loyalty?.tier ?? 'BRONZE'} — ${loyalty?.redeemablePoints ?? 0} points`, facts, rows: [], constraints: ['Ground in loyalty points.'] };
  }, [loyalty]);

  if (loading) return <div className="page"><LoadingSpinner /></div>;
  if (error) return <div className="page"><ErrorMessage message={error} /></div>;

  if (!loyalty || (loyalty.totalPoints === 0 && loyalty.redeemablePoints === 0)) {
    return (
      <div className="page">
        <PageHeader title={t('loyalty.title')} />
        <EmptyState icon="⭐" title={t('loyalty.noData')} sub={t('loyalty.noDataSub')} />
        <div style={{ marginTop: '1.5rem' }}>
          <AiAssistant module="marketplace" feature="recommend" context={loyaltyContext} title="AI · Loyalty" description="Ask about points and tiers — AI sees your loyalty." />
        </div>
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

      <div style={{ marginTop: '1.5rem' }}>
        <AiAssistant
          module="marketplace"
          feature="recommend"
          features={['assistant', 'recommend', 'summarize']}
          context={loyaltyContext}
          title="AI · Loyalty"
          description={`You have ${loyalty.redeemablePoints} points — AI sees your tier.`}
          placeholder="e.g. How to earn more points? Recommend rewards…"
          suggestedPrompts={['How to earn more points?', 'What tier is next?', 'Recommend rewards for my points']}
        />
      </div>
    </div>
  );
}
