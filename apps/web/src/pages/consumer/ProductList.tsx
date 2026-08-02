import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader, ProductCard } from '../../components/ui';
import type { Product, Address, Vendor } from '../../types';

interface CartItem extends Product {
  quantity: number;
}

function ProductList() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { data: products, loading, error } = useApi<Product[]>(
    `/products?vendorId=${vendorId}`,
    [vendorId]
  );
  const { data: addresses } = useApi<Address[]>('/addresses/me');
  const { data: vendors } = useApi<Vendor[]>('/vendors');
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const firstId = products[0].id;
    api.get(`/products/${firstId}/similar?limit=4`).then(res => {
      const data = res.data?.data?.data || res.data?.data || [];
      setSimilarProducts(Array.isArray(data) ? data : []);
    }).catch(() => setSimilarProducts([]));
  }, [products]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`cart-${vendorId}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [submitting, setSubmitting] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault);
      setSelectedAddressId((prev) => prev || (def?.id ?? addresses[0].id));
    }
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem(`cart-${vendorId}`, JSON.stringify(cart));
  }, [cart, vendorId]);

  const addToCart = (product: Product) => {
    setCartError(null);
    setCartSuccess(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const decrement = (productId: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const checkout = async () => {
    if (!vendorId) return;
    const selectedAddr = addresses?.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setCartError('Please select a delivery address before checkout.');
      return;
    }
    setCartError(null);
    setCartSuccess(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; data: { otpCode?: string } }>('/orders', {
        vendorId,
        type: 'general',
        items: cart.map((i) => ({
          productId: i.id,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        deliveryAddress: selectedAddr.fullAddress,
        deliveryLatitude: selectedAddr.latitude ?? undefined,
        deliveryLongitude: selectedAddr.longitude ?? undefined,
        paymentMethod,
      });
      const otpCode = res.data.data.otpCode;
      setCart([]);
      localStorage.removeItem(`cart-${vendorId}`);
      setCartSuccess(
        otpCode
          ? `Order placed! Your delivery confirmation code is ${otpCode}. Share it with your driver at delivery.`
          : 'Order placed successfully!',
      );
      setTimeout(() => navigate('/orders'), 5000);
    } catch (err: any) {
      setCartError(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  const currentVendor = (vendors || []).find((v) => v.id === vendorId);

  return (
    <div className="page">
      <PageHeader
        title={currentVendor?.shopName || t('product.title')}
        subtitle={t('product.subtitle')}
      />

      <div className="grid responsive-grid-2col" style={{ gridTemplateColumns: '1fr 340px', alignItems: 'start' }}>
        <div>
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && (
            products && products.length === 0 ? (
              <div className="card"><div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>{t('product.noProducts')}</div></div>
            ) : (
              <div className="grid grid-auto-sm">
                {products?.map((p) => (
                  <ProductCard
                    key={p.id}
                    name={p.name}
                    price={p.price}
                    imageUrl={p.imageUrl}
                    stockQuantity={p.stockQuantity}
                    unit={p.unit}
                    actionLabel={p.stockQuantity <= 0 ? t('product.unavailable') : t('product.placeOrder')}
                    onClick={() => addToCart(p)}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {/* Cart */}
        <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 1rem)', maxHeight: 'calc(100vh - var(--topbar-h) - 2rem)', overflowY: 'auto' }}>
          <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>🛒 {t('product.cart')} <span className="badge badge-brand">{cart.length}</span></h2>

          {cartError && <div className="alert alert-error mb-1"><span>⚠️</span><span>{cartError}</span></div>}
          {cartSuccess && <div className="alert alert-success mb-1">✅ {cartSuccess}</div>}

          {cart.length === 0 ? (
            <div className="empty" style={{ padding: '2rem 1rem' }}>
              <div className="empty-icon">🛒</div>
              <div className="empty-title">{t('product.emptyCart')}</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--line-soft)', fontSize: '0.85rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }} onClick={() => decrement(item.id)}>−</button>
                      <span style={{ fontWeight: 800 }}>{item.quantity}</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }} onClick={() => addToCart(item)}>+</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', color: 'var(--danger)' }} onClick={() => removeFromCart(item.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)', borderTop: '2px solid var(--line)', paddingTop: '0.75rem' }}>
                <span>Total</span>
                <span className="text-brand" style={{ fontSize: '1.15rem' }}>{formatCurrency(total)}</span>
              </div>

              <div className="mt-2">
                <label className="field-label">{t('product.deliveryAddress')} *</label>
                {addresses && addresses.length > 0 ? (
                  <select className="select" value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                    <option value="">{t('order.selectAddress')}...</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>{addr.label} — {addr.fullAddress}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {t('order.noAddresses')}.{' '}
                    <a href="/addresses" style={{ color: 'var(--brand)', fontWeight: 700 }}>{t('order.addOne')}</a> before checkout.
                  </div>
                )}
              </div>
              <div className="mt-1">
                <label className="field-label">{t('product.paymentMethod')}</label>
                <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="mpesa">M-Pesa</option>
                  <option value="tigo_money">Mixx by Yas (Tigo)</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="halotel">Halotel</option>
                  <option value="card">Card / Virtual Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash on Delivery</option>
                </select>
              </div>
              <button className="btn btn-primary btn-lg btn-block mt-2" disabled={submitting} onClick={checkout}>
                {submitting ? t('product.placingOrder') : `${t('product.checkout')} • ${formatCurrency(total)}`}
              </button>
            </>
          )}
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div className="section">
          <h3 className="section-title">✨ {t('app.recommended')}</h3>
          <div className="grid grid-auto-sm">
            {similarProducts.map((sp: any) => (
              <ProductCard
                key={sp.id}
                name={sp.name}
                price={Number(sp.price)}
                imageUrl={sp.image_url || sp.imageUrl}
                actionLabel={t('product.placeOrder')}
                onClick={() => navigate(`/vendors/${sp.vendor_id}/products`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
