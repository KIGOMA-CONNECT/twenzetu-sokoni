import { useCurrency } from '../../context/CurrencyContext';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import api from '../../api/client';

export default function SubscriptionPage() {
  const { formatCurrency } = useCurrency();
  const { data: subscriptions, loading, error, refetch } = useApi<any[]>('/subscriptions');

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/subscriptions/${id}`, { status });
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const cancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      api.delete(`/subscriptions/${id}`).then(() => refetch()).catch(alert);
    }
  };

  return (
    <div className="page">
      <PageHeader title="My Subscriptions" sub="Manage your recurring orders for groceries and essentials" />

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (!subscriptions || subscriptions.length === 0) && (
        <EmptyState icon="🔁" title="No subscriptions yet" sub="Browse vendors and set up a recurring order!" />
      )}

      {!loading && subscriptions && subscriptions.length > 0 && (
        <div className="stack">
          {subscriptions.map((sub: any) => (
            <div key={sub.id} className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>{sub.product_name || 'Product'}</h3>
                  <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{sub.vendor_name || 'Vendor'}</p>
                </div>
                <span className={`badge ${sub.status === 'ACTIVE' ? 'badge-green' : sub.status === 'PAUSED' ? 'badge-amber' : 'badge-red'}`}>{sub.status}</span>
              </div>

              <div className="grid grid-3" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Quantity</div>
                  <div className="text-bold">{sub.quantity} x {formatCurrency(Number(sub.product_price) || 0)}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Frequency</div>
                  <div className="text-bold" style={{ textTransform: 'capitalize' }}>{sub.frequency}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Next Order</div>
                  <div className="text-bold">{sub.next_order_date ? new Date(sub.next_order_date).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              <div className="flex gap-1">
                {sub.status === 'ACTIVE' && (
                  <button className="btn btn-primary" onClick={() => updateStatus(sub.id, 'PAUSED')}>Pause</button>
                )}
                {sub.status === 'PAUSED' && (
                  <button className="btn btn-primary" onClick={() => updateStatus(sub.id, 'ACTIVE')}>Resume</button>
                )}
                {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
                  <button className="btn btn-danger" onClick={() => cancel(sub.id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
