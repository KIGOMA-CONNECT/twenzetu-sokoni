import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import api from '../../api/client';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { data: subscriptions, loading, error, refetch } = useApi<any[]>('/subscriptions');
  const [actionError, setActionError] = useState<string | null>(null);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/subscriptions/${id}`, { status });
      refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || t('subscription.updateFailed'));
    }
  };

  const cancel = async (id: string) => {
    if (window.confirm(t('subscription.cancelConfirm'))) {
      try {
        await api.delete(`/subscriptions/${id}`);
        refetch();
      } catch (err: any) {
        setActionError(err.response?.data?.message || err.message || t('subscription.cancelFailed'));
      }
    }
  };

  return (
    <div className="page">
      <PageHeader title={t('subscription.title')} sub={t('subscription.subtitle')} />

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (!subscriptions || subscriptions.length === 0) && (
        <EmptyState icon="🔁" title={t('subscription.noSubscriptions')} sub={t('subscription.browseVendors')} />
      )}

      {!loading && subscriptions && subscriptions.length > 0 && (
        <div className="stack">
          {subscriptions.map((sub: any) => (
            <div key={sub.id} className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>{sub.product_name || t('subscription.product')}</h3>
                  <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{sub.vendor_name || t('subscription.vendor')}</p>
                </div>
                <span className={`badge ${sub.status === 'ACTIVE' ? 'badge-green' : sub.status === 'PAUSED' ? 'badge-amber' : 'badge-red'}`}>{sub.status}</span>
              </div>

              <div className="grid grid-3" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('subscription.quantity')}</div>
                  <div className="text-bold">{sub.quantity} x {formatCurrency(Number(sub.product_price) || 0)}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('subscription.frequency')}</div>
                  <div className="text-bold" style={{ textTransform: 'capitalize' }}>{sub.frequency}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('subscription.nextOrder')}</div>
                  <div className="text-bold">{sub.next_order_date ? new Date(sub.next_order_date).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              <div className="flex gap-1">
                {sub.status === 'ACTIVE' && (
                  <button className="btn btn-primary" onClick={() => updateStatus(sub.id, 'PAUSED')}>{t('subscription.pause')}</button>
                )}
                {sub.status === 'PAUSED' && (
                  <button className="btn btn-primary" onClick={() => updateStatus(sub.id, 'ACTIVE')}>{t('subscription.resume')}</button>
                )}
                {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
                  <button className="btn btn-danger" onClick={() => cancel(sub.id)}>{t('subscription.cancel')}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
