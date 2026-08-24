import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import type { Vendor } from '../../types';
import { PageTitle } from '../../components/PageTitle';

function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { cart, activeVendorId, loading, mutation, error, itemCount, updateItem, removeItem, clearCart } = useCart();
  const { data: vendor } = useApi<Vendor>(activeVendorId ? `/vendors/${activeVendorId}` : null);

  if (!activeVendorId) {
    return (
      <div className="page">
        <PageHeader title={t('cart.title')} subtitle={t('cart.subtitle')} />
        <EmptyState
          icon="🛒"
          title={t('cart.noVendor')}
          sub={t('cart.browse')}
        />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/vendors')}>
            {t('app.browseVendors')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageTitle title="Cart" />
      <PageHeader title={t('cart.title')} subtitle={t('cart.subtitle')} />
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && (!cart || cart.items.length === 0) ? (
        <>
          <EmptyState icon="🛒" title={t('cart.empty')} sub={t('cart.browse')} />
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/vendors')}>
              {t('app.browseVendors')}
            </button>
          </div>
        </>
      ) : (
        !loading && cart && (
          <div className="grid responsive-grid-2col" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>
            <div className="card">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--line-soft)' }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.productName}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" style={{ marginLeft: '1rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.5rem' }}
                        disabled={mutation}
                        onClick={() => updateItem(item.productId, Math.max(1, item.quantity - 1))}
                      >
                        −
                      </button>
                      <span style={{ fontWeight: 800, minWidth: '1.5rem', textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.5rem' }}
                        disabled={mutation}
                        onClick={() => updateItem(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.5rem', color: 'var(--danger)' }}
                        disabled={mutation}
                        onClick={() => removeItem(item.productId)}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--ink)', minWidth: '5rem', textAlign: 'right' }}>
                      {formatCurrency(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 1rem)' }}>
              <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>🧾 {t('cart.summaryTitle')}</h2>
              {vendor && (
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  {t('cart.vendor')}:{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/vendors/${activeVendorId}/products`);
                    }}
                    style={{ color: 'var(--brand)', fontWeight: 700 }}
                  >
                    {vendor.shopName}
                  </a>
                </div>
              )}
              <div className="flex justify-between items-center" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>
                <span>{t('cart.total')} ({itemCount})</span>
                <span className="text-brand" style={{ fontSize: '1.25rem' }}>
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                {t('cart.deliveryFeeNote')}
              </div>
              <button
                className="btn btn-primary btn-lg btn-block mt-2"
                disabled={mutation}
                onClick={() => navigate('/checkout')}
              >
                {t('cart.proceed')}
              </button>
              <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
                <button className="btn btn-outline btn-block" onClick={() => navigate('/vendors')}>
                  {t('cart.continueShopping')}
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={mutation}
                  onClick={() => {
                    if (window.confirm(t('cart.clearConfirm'))) clearCart();
                  }}
                >
                  {t('cart.clear')}
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default CartPage;
