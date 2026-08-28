import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDevice } from '../../hooks/useDevice';
import { SectionTitle, ProductCard } from '../../components/ui';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import AiAssistant from '../../components/AiAssistant';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types';

const GENERAL_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000080', name: 'Electronics', emoji: '📱', desc: 'Simu, Laptop, TV' },
  { id: 'd0000000-0000-0000-0000-000000000081', name: 'Vifaa vya Nyumbani', emoji: '🏠', desc: 'Jiko, Fridge, Blender' },
  { id: 'd0000000-0000-0000-0000-000000000082', name: 'Fanicha', emoji: '🛋️', desc: 'Kitanda, Kiti, Meza' },
  { id: 'd0000000-0000-0000-0000-000000000083', name: 'Vyombo vya Usafiri', emoji: '🚗', desc: 'Gari, Boda,-parts' },
  { id: 'd0000000-0000-0000-0000-000000000084', name: 'Vifaa vya Ujenzi', emoji: '🔨', desc: 'Cement, Mabati, Nails' },
  { id: 'd0000000-0000-0000-0000-000000000085', name: 'Mitandao na Simu', emoji: '📡', desc: 'Airtime, Data, POS' },
  { id: 'd0000000-0000-0000-0000-000000000086', name: 'Vifaa vya Michezo', emoji: '⚽', desc: 'Mpira, Gym, Games' },
  { id: 'd0000000-0000-0000-0000-000000000087', name: 'Vitabu na Vifaa vya Masomo', emoji: '📚', desc: 'Shule, University' },
];

export default function GeneralProductsPage() {
  const navigate = useNavigate();
  const device = useDevice();
  const { t } = useTranslation();
  const [activeSub, setActiveSub] = useState<(typeof GENERAL_SUBS)[number] | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const { setActiveVendor, addItem } = useCart();
  const isPhone = device.type === 'phone';
  const { data: products, loading, error } = useApi<Product[]>(
    activeSub ? `/public/products?categoryId=${activeSub.id}&limit=24` : null,
    [activeSub],
  );

  const consumerContext = useMemo(() => {
    const facts: Record<string, unknown> = {
      activeCategory: activeSub?.name ?? '(none)',
      productCount: products?.length ?? 0,
      hasProducts: (products?.length ?? 0) > 0 ? 'yes' : 'no',
    };
    const rows = (products ?? []).slice(0, 15).map((p) => ({ kind: 'product', name: p.name, price: p.price, stockQuantity: p.stockQuantity }));
    return { summary: `General products — ${activeSub?.name ?? 'browse'} — ${products?.length ?? 0} products`, facts, rows, constraints: ['Ground in displayed products.'] };
  }, [activeSub, products]);

  async function handleAdd(p: Product) {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    setCartError(null);
    try {
      setActiveVendor(p.vendorId);
      await addItem(p.id);
    } catch (err: any) {
      setCartError(err?.response?.data?.message || err?.message || t('generalProducts.failedToAddToCart'));
    }
  }

  return (
    <div className="page" style={{ paddingTop: device.safeAreaInsets.top || undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>←</button>
        <div>
          <h1 style={{ fontSize: isPhone ? '1.2rem' : '1.5rem', fontWeight: 800 }}>🛍️ {t('generalProducts.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('generalProducts.subtitle')}</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <AiAssistant
          module="consumer"
          feature="recommend"
          features={['assistant', 'recommend', 'summarize', 'analyze']}
          context={consumerContext}
          title="AI · Shopping Assistant"
          description={`Ask about ${activeSub?.name ?? 'all'} — grounded in ${products?.length ?? 0} products.`}
          placeholder={t('generalProducts.describePlaceholder')}
          suggestedPrompts={['Unatafuta nini leo?', 'Nina bajeti ya 50000, nini ni bora?', 'Jiko vs Fridge — nipe mapendekezo']}
        />
      </div>

      {/* Subcategories */}
      <SectionTitle title={t('common.categories')} emoji="📦" />
      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {GENERAL_SUBS.map((sub) => (
          <button
            key={sub.id}
            onClick={() => { setCartError(null); setActiveSub(sub); }}
            style={{
              padding: '1rem', borderRadius: 'var(--radius-lg)', border: activeSub?.id === sub.id ? '2px solid var(--brand)' : '1px solid var(--line)',
              background: activeSub?.id === sub.id ? 'color-mix(in srgb, var(--brand) 8%, var(--surface))' : 'var(--surface)', cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{sub.emoji}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{sub.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{sub.desc}</div>
          </button>
        ))}
      </div>

      {/* Products for the selected subcategory */}
      {activeSub && (
        <>
          <SectionTitle title={`${activeSub.emoji} ${activeSub.name}`} emoji="" />
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && (
            products && products.length > 0 ? (
              <div className="grid grid-auto-sm" style={{ marginBottom: '1.5rem' }}>
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    name={p.name}
                    price={p.price}
                    imageUrl={p.imageUrl}
                    stockQuantity={p.stockQuantity}
                    unit={p.unit}
                    actionLabel={p.stockQuantity <= 0 ? t('common.unavailable') : t('cart.addToCart')}
                    onClick={() => handleAdd(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem 0', marginBottom: '1.5rem' }}>
                {t('generalProducts.noProductsInCategory')}
              </div>
            )
          )}
        </>
      )}
      {cartError && (
        <div className="card" style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '0.85rem', padding: '0.7rem 1rem', marginBottom: '1rem' }}>
          ⚠️ {cartError}
        </div>
      )}
    </div>
  );
}
