import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import type { Address, CheckoutResult } from '../../types';
import { PageTitle } from '../../components/PageTitle';

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'tigo_money', label: 'Mixx by Yas (Tigo)' },
  { value: 'tigo_pesa', label: 'Tigo Pesa' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'halotel', label: 'Halotel' },
  { value: 'azampesa', label: 'AzamPay' },
  { value: 'cash', label: 'Cash on Delivery' },
];

function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { cart, activeVendorId, loading, mutation, error, checkout, reset } = useCart();
  const { data: addresses, loading: addressesLoading } = useApi<Address[]>('/addresses/me');

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault);
      setSelectedAddressId((prev) => prev || (def?.id ?? addresses[0].id));
    }
  }, [addresses]);

  if (!activeVendorId || (!loading && cart && cart.items.length === 0)) {
    return (
      <div className="page">
        <PageHeader title={t('cart.title')} subtitle={t('cart.checkout')} />
        <EmptyState icon="🧾" title={t('cart.empty')} sub={t('cart.browse')} />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/vendors')}>
            {t('app.browseVendors')}
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="page" style={{ maxWidth: '560px', margin: '0 auto' }}>
        <PageHeader title={t('cart.success')} />
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>🎉</div>
          <h2 style={{ margin: '0.5rem 0' }}>{t('cart.success')}</h2>
          {result.otpCode && (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <span>{t('cart.otpMessage', { code: result.otpCode })}</span>
            </div>
          )}
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Order ID: {result.orderId}
          </div>
          <div className="flex gap-1" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>
              {t('cart.ordersLink')}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                reset();
                navigate('/vendors');
              }}
            >
              {t('cart.continueShopping')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedAddr = addresses?.find((a) => a.id === selectedAddressId);
  const placeOrder = async () => {
    if (!cart) return;
    if (!selectedAddr) return;
    const payload = {
      cartId: cart.id,
      paymentMethod,
      deliveryAddress: selectedAddr.fullAddress,
      deliveryLatitude: selectedAddr.latitude,
      deliveryLongitude: selectedAddr.longitude,
      specialInstructions: instructions || undefined,
      currency: cart.currency,
      customerEmail: user?.email || undefined,
    };
    const res = await checkout(payload);
    if (res) setResult(res);
  };

  return (
    <div className="page">
      <PageTitle title="Checkout" />
      <PageHeader title={t('cart.checkout')} />
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && cart && (
        <div className="grid responsive-grid-2col" style={{ gridTemplateColumns: '1fr 340px', alignItems: 'start' }}>
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>📍 {t('product.deliveryAddress')}</h2>
            {addressesLoading ? (
              <LoadingSpinner />
            ) : addresses && addresses.length > 0 ? (
              <select className="select" value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                <option value="">{t('order.selectAddress')}...</option>
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label} — {addr.fullAddress}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {t('order.noAddresses')}.{' '}
                <a href="/addresses" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                  {t('order.addOne')}
                </a>{' '}
                before checkout.
              </div>
            )}

            <h2 className="section-title" style={{ margin: '1.25rem 0 0.75rem' }}>💳 {t('product.paymentMethod')}</h2>
            <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <h2 className="section-title" style={{ margin: '1.25rem 0 0.75rem' }}>📝 {t('cart.instructions')}</h2>
            <textarea
              className="textarea"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('cart.instructions')}
            />
          </div>

          <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 1rem)' }}>
            <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>🧾 {t('cart.summaryTitle')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center" style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--ink)' }}>
                    {item.productName}{' '}
                    <span style={{ color: 'var(--muted)' }}>× {item.quantity}</span>
                  </span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)', borderTop: '2px solid var(--line)', paddingTop: '0.75rem' }}>
              <span>{t('cart.subtotal')}</span>
              <span className="text-brand" style={{ fontSize: '1.25rem' }}>{formatCurrency(cart.subtotal)}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              {t('cart.deliveryFeeNote')}
            </div>
            <button
              className="btn btn-primary btn-lg btn-block mt-2"
              disabled={mutation || !selectedAddr}
              onClick={placeOrder}
            >
              {mutation ? t('product.placingOrder') : `${t('cart.proceed')} • ${formatCurrency(cart.subtotal)}`}
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/cart')}>
              {t('cart.backToCart')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
