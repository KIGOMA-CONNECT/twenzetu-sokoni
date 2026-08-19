import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, ProductCard } from '../../components/ui';
import type { Product, Vendor } from '../../types';

function ProductList() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { data: products, loading, error } = useApi<Product[]>(
    `/public/products?vendorId=${vendorId}`,
    [vendorId]
  );
  const { data: vendors } = useApi<Vendor[]>('/public/vendors');
  const { data: mapsConfig } = useApi<{ key?: string; configured?: boolean }>('/public/maps-key');
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);

  const { cart, activeVendorId, setActiveVendor, addItem, updateItem, removeItem, mutation, error: cartError } = useCart();

  useEffect(() => {
    if (vendorId && activeVendorId !== vendorId) {
      setActiveVendor(vendorId);
    }
  }, [vendorId, activeVendorId, setActiveVendor]);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const firstId = products[0].id;
    api.get(`/public/products/${firstId}/similar?limit=4`).then(res => {
      const data = res.data?.data?.data || res.data?.data || [];
      setSimilarProducts(Array.isArray(data) ? data : []);
    }).catch(() => setSimilarProducts([]));
  }, [products]);

  const currentVendor = (vendors || []).find((v) => v.id === vendorId);

  const handleAdd = async (p: Product) => {
    if (!vendorId) return;
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    try {
      await addItem(p.id);
    } catch {
      /* cartError is surfaced below */
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={currentVendor?.shopName || t('product.title')}
        subtitle={t('product.subtitle')}
      />

      {currentVendor?.latitude != null &&
        currentVendor.longitude != null &&
        mapsConfig?.configured &&
        mapsConfig.key && (
          <div className="card" style={{ marginBottom: '1.25rem', padding: '0.75rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--ink)' }}>📍 {t('vendor.location', 'Shop Location')}</div>
            <iframe
              title={`${currentVendor.shopName} location`}
              src={`https://www.google.com/maps?q=${currentVendor.latitude},${currentVendor.longitude}&z=15&output=embed&key=${mapsConfig.key}`}
              style={{ width: '100%', height: 240, border: 0, borderRadius: 10 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

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
                    actionLabel={p.stockQuantity <= 0 ? t('product.unavailable') : t('cart.addToCart')}
                    onClick={() => handleAdd(p)}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {/* Cart */}
        <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 1rem)', maxHeight: 'calc(100vh - var(--topbar-h) - 2rem)', overflowY: 'auto' }}>
          <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>🛒 {t('product.cart')} <span className="badge badge-brand">{cart?.itemCount ?? 0}</span></h2>

          {cartError && <div className="alert alert-error mb-1"><span>⚠️</span><span>{cartError}</span></div>}

          {!cart || cart.items.length === 0 ? (
            <div className="empty" style={{ padding: '2rem 1rem' }}>
              <div className="empty-icon">🛒</div>
              <div className="empty-title">{t('product.emptyCart')}</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {cart.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--line-soft)', fontSize: '0.85rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.productName}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                        {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }} disabled={mutation} onClick={() => updateItem(item.productId, Math.max(1, item.quantity - 1))}>−</button>
                      <span style={{ fontWeight: 800 }}>{item.quantity}</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem' }} disabled={mutation} onClick={() => updateItem(item.productId, item.quantity + 1)}>+</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', color: 'var(--danger)' }} disabled={mutation} onClick={() => removeItem(item.productId)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)', borderTop: '2px solid var(--line)', paddingTop: '0.75rem' }}>
                <span>{t('cart.subtotal')}</span>
                <span className="text-brand" style={{ fontSize: '1.15rem' }}>{formatCurrency(cart.subtotal)}</span>
              </div>
              <button className="btn btn-primary btn-lg btn-block mt-2" onClick={() => navigate('/cart')}>
                {t('cart.viewCart')}
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
