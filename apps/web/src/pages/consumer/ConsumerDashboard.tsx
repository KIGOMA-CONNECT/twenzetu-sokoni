import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
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
  'Fresh Produce': '🥕',
  'Electronics': '📱',
};

const CATEGORY_BG: Record<string, string> = {
  '🍲': '#ccfbf1', '🥬': '#dcfce7', '🍚': '#fef9c3', '🧵': '#fbcfe8',
  '🧹': '#e0f2fe', '👩‍🍳': '#ffedd5', '♻️': '#fde68a', '📱': '#ddd6fe', '🥕': '#ffedd5',
};

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

  const activeOrders = (orders || []).filter((o) =>
    ['PLACED', 'CONFIRMED', 'ESCROW_HELD'].includes(o.status)
  ).length;
  const totalSpent = (orders || []).reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );
  const loyaltyPoints = Math.floor(totalSpent / 1000);
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="page">
      {/* Hero welcome */}
      <section className="hero" style={{ borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
        <div style={{ maxWidth: 700, padding: '2.25rem 2rem', position: 'relative', zIndex: 1 }}>
          <span className="hero-badge" style={{ marginBottom: '0.9rem' }}>🎉 Karibu, {firstName}!</span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            What would you like <span className="hero-gradient">today?</span>
          </h1>
          <p style={{ color: 'var(--muted)', margin: '0.6rem 0 1.25rem' }}>{t('app.welcomeBack')}</p>
          <div className="flex gap-2 wrap">
            <button className="btn btn-accent" onClick={() => navigate('/catalog')}>🛒 {t('catalog.title')}</button>
            <button className="btn btn-outline" onClick={() => navigate('/vendors')}>🏪 {t('app.browseVendors')}</button>
          </div>
        </div>
      </section>

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

          {/* Categories */}
          <div className="section">
            <SectionTitle title={t('app.categories')} emoji="🛍️" />
            <div className="cat-scroll">
              <div className="cat-tile" onClick={() => navigate('/services')}>
                <div className="cat-emoji" style={{ background: 'var(--brand-soft)' }}>🧰</div>
                <div className="cat-name">Services</div>
              </div>
              {(categories ?? []).map((category) => {
                const icon = categoryIcon(category);
                return (
                  <div key={category.id} className="cat-tile" onClick={() => navigate(`/vendors?category=${encodeURIComponent(category.type)}`)}>
                    <div className="cat-emoji" style={{ background: CATEGORY_BG[icon] || 'var(--brand-soft)' }}>{icon}</div>
                    <div className="cat-name">{category.name}</div>
                  </div>
                );
              })}
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
