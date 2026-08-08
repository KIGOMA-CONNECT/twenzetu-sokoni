import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { useDevice } from '../../hooks/useDevice';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Recommendations } from '../../components/Recommendations';
import { SectionTitle } from '../../components/ui';
import type { Order, Category } from '../../types';

const TYPE_ICONS: Record<string, string> = {
  food: '🍲',
  grocery: '🍚',
  electronics: '📱',
  general: '🧵',
  secondhand: '♻️',
  laundry: '🧺',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Chakula Kilicho Tayari': '🍲',
  'Mboga na Matunda': '🥬',
  'Mchele na Maharage': '🍚',
  'Ufuaji na Usafishaji Nguo': '🧵',
  'Usafi Nyumbani na Bustani': '🧹',
  'Kupikiwa Nyumbani (Wapishi)': '👩‍🍳',
  'Vitu vya Used': '♻️',
  'Electronics na Bidhaa Nyingine': '📱',
  'Electronics': '📱',
  'Ushonaji na Tailoring': '🧵',
  'Nguo za Used': '👕',
  'Electronics za Used': '📱',
  'Mitambo na Machine': '⚙️',
  'Tools na Zana': '🔧',
  'Fanicha za Used': '🛋️',
};

const CATEGORY_BG: Record<string, string> = {
  '🍲': '#ccfbf1', '🥬': '#dcfce7', '🍚': '#fef9c3', '🧵': '#fbcfe8',
  '🧹': '#e0f2fe', '👩‍🍳': '#ffedd5', '♻️': '#fde68a', '📱': '#ddd6fe',
  '👕': '#fbcfe8', '⚙️': '#e2e8f0', '🔧': '#d1fae5', '🛋️': '#fef3c7',
};

const PRODUCE_NAMES = new Set(['Mboga na Matunda']);

const CATEGORY_ORDER: Record<string, number> = {
  'Mboga na Matunda': 10,
  'Mchele na Maharage': 30,
  'Chakula Kilicho Tayari': 40,
  'Kupikiwa Nyumbani (Wapishi)': 50,
  'Ufuaji na Usafishaji Nguo': 60,
  'Usafi Nyumbani na Bustani': 70,
  'Ushonaji na Tailoring': 75,
  'Electronics': 80,
  'Vitu vya Used': 90,
  'Nguo za Used': 91,
  'Electronics za Used': 92,
  'Mitambo na Machine': 93,
  'Tools na Zana': 94,
  'Fanicha za Used': 95,
};

const USED_PARENT_ID = 'd0000000-0000-0000-0000-000000000018';

const USED_SUBCATEGORY_IDS = new Set([
  'd0000000-0000-0000-0000-000000000022',
  'd0000000-0000-0000-0000-000000000023',
  'd0000000-0000-0000-0000-000000000024',
  'd0000000-0000-0000-0000-000000000025',
  'd0000000-0000-0000-0000-000000000026',
]);

function categoryIcon(category: Category): string {
  return CATEGORY_ICONS[category.name] ?? TYPE_ICONS[category.type] ?? '🛍️';
}

function ConsumerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { data: orders, loading, error } = useApi<Order[]>('/orders', []);
  const { data: categories } = useApi<Category[]>('/categories', []);
  const device = useDevice();

  const activeOrders = (orders || []).filter((o) =>
    ['PLACED', 'CONFIRMED', 'ESCROW_HELD'].includes(o.status)
  ).length;
  const totalSpent = (orders || []).reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );
  const loyaltyPoints = Math.floor(totalSpent / 1000);
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const isPhone = device.type === 'phone';
  const isSmallPhone = device.phoneSize === 'small';
  const heroMinHeight = isSmallPhone ? '160px' : isPhone ? '180px' : '220px';
  const heroPadding = isSmallPhone ? '1.5rem 1rem' : isPhone ? '1.75rem 1.25rem' : '2rem';
  const categoryCols = isSmallPhone ? 3 : isPhone ? 4 : device.type === 'tablet' ? 5 : 6;

  return (
    <div className="page" style={{ paddingTop: device.safeAreaInsets.top || undefined }}>
      {/* Hero welcome */}
      <section className="hero" style={{ borderRadius: 'var(--radius-lg)', marginBottom: isPhone ? '1rem' : '1.5rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: heroMinHeight, padding: heroPadding, textAlign: 'center' }}>
          <div>
            <span className="hero-badge" style={{ marginBottom: '0.9rem' }}>🎉 Karibu, {firstName}!</span>
            <h1 style={{ fontSize: isSmallPhone ? '1.4rem' : 'clamp(1.6rem, 4vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              What would you like <span className="hero-gradient">today?</span>
            </h1>
            <p style={{ color: 'var(--muted)', margin: '0.6rem 0 0', fontSize: isSmallPhone ? '0.9rem' : '1.05rem' }}>Welcome back to afriMarket</p>
          </div>
        </div>
      </section>

      {/* Categories — right after hero */}
      <div className="section">
        <SectionTitle title={t('app.categories')} emoji="🛍️" />
        <div className="cat-scroll">
          <div className="cat-tile" onClick={() => navigate('/services')}>
            <div className="cat-emoji" style={{ background: 'var(--brand-soft)' }}>🧰</div>
            <div className="cat-name">Services</div>
          </div>
          <div className="cat-tile" onClick={() => navigate('/services')}>
            <div className="cat-emoji" style={{ background: '#e0f2fe' }}>🚚</div>
            <div className="cat-name">{t('app.cargoLogistics')}</div>
            <div className="cat-sub" style={{ fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1.2 }}>{t('app.cargoLogisticsSub')}</div>
          </div>
          {(categories ?? [])
            .filter((c) => !USED_SUBCATEGORY_IDS.has(c.id))
            .slice()
            .sort((a, b) => (CATEGORY_ORDER[a.name] ?? 999) - (CATEGORY_ORDER[b.name] ?? 999))
            .map((category) => {
            const icon = categoryIcon(category);
            const produce = PRODUCE_NAMES.has(category.name);
            const hasChildren = (categories ?? []).some((c) => c.parentId === category.id);
            const isUsed = category.id === USED_PARENT_ID;
            return (
              <div key={category.id} className="cat-tile" onClick={() => navigate(isUsed ? '/used-goods' : `/vendors?category=${encodeURIComponent(category.type)}`)}>
                <div className="cat-emoji" style={{ background: CATEGORY_BG[icon] || 'var(--brand-soft)' }}>{icon}</div>
                <div className="cat-name">{category.name}</div>
                {produce && (
                  <div className="cat-sub" style={{ fontSize: '0.62rem', color: '#16a34a', lineHeight: 1.2, fontWeight: 700 }}>{t('app.freshSokoSub')}</div>
                )}
                {hasChildren && (
                  <div className="cat-sub" style={{ fontSize: '0.6rem', color: 'var(--muted)', lineHeight: 1.2, fontWeight: 700 }}>Nguo · Electronics · Mitambo · Tools · Fanicha ›</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 wrap" style={{ marginTop: '1.25rem' }}>
          <button className="btn btn-accent" onClick={() => navigate('/catalog')}>🛒 {t('catalog.title')}</button>
          <button className="btn btn-outline" onClick={() => navigate('/vendors')}>🏪 {t('app.browseVendors')}</button>
        </div>
      </div>

      {/* AI Custom Request / RFQ banner */}
      <button
        className="btn"
        onClick={() => navigate('/vendors?category=procurement')}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(120deg, #1e3a8a, #4f46e5)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span style={{ fontSize: '1.8rem' }}>🤖</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 800, fontSize: '1.05rem' }}>
            {t('app.customRequestTitle')} {t('app.customRequestSub')}
          </span>
          <span style={{ display: 'block', opacity: 0.85, fontSize: '0.85rem', marginTop: '0.15rem' }}>
            🛍️ AI Procurement Engine · Custom Request / Sauti / Picha
          </span>
        </span>
        <span style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: 700 }}>{t('app.customRequestCta')} →</span>
      </button>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-2 mb-3">
            <div className="stat-card">
              <div className="stat-label">{t('app.activeOrders')}</div>
              <div className="stat-value">{activeOrders}</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-label">{t('app.totalSpent')}</div>
              <div className="stat-value">{formatCurrency(totalSpent)}</div>
            </div>
            <div className="stat-card violet">
              <div className="stat-label">{t('app.loyaltyPoints')}</div>
              <div className="stat-value">{loyaltyPoints} ⭐</div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="section">
            <SectionTitle title={t('app.quickLinks')} emoji="⚡" />
            <div className="flex gap-2 wrap">
              <button className="btn btn-primary" onClick={() => navigate('/orders')}>📦 My Orders</button>
              <button className="btn btn-outline" onClick={() => navigate('/referrals')}>🎁 {t('nav.referrals')}</button>
              <button className="btn btn-outline" onClick={() => navigate('/subscriptions')}>🔁 {t('nav.subscriptions')}</button>
              <button className="btn btn-outline" onClick={() => navigate('/wallet')}>💳 Wallet</button>
            </div>
          </div>

          <Recommendations title={t('app.featured')} endpoint="/recommendations/featured" />
          <Recommendations title={t('app.recommended')} endpoint="/recommendations/for-you" />
        </>
      )}
    </div>
  );
}

export default ConsumerDashboard;
