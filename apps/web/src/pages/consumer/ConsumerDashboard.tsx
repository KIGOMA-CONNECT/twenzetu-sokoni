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

// ── New parent category IDs ──
const PARENT_IDS = {
  FOOD_SERVICES:  'd0000000-0000-0000-0000-000000000030',
  FRESH_PRODUCE:  'd0000000-0000-0000-0000-000000000031',
  HOME_GARDEN:    'd0000000-0000-0000-0000-000000000032',
  LAUNDRY:        'd0000000-0000-0000-0000-000000000033',
  TAILORING:      'd0000000-0000-0000-0000-000000000034',
  GENERAL:        'd0000000-0000-0000-0000-000000000035',
  CARGO:          'd0000000-0000-0000-0000-000000000036',
  USED:           'd0000000-0000-0000-0000-000000000018',
};

const CATEGORY_ICONS: Record<string, string> = {
  // Parents
  [PARENT_IDS.FOOD_SERVICES]: '🍲',
  [PARENT_IDS.FRESH_PRODUCE]: '🥬',
  [PARENT_IDS.HOME_GARDEN]:   '🧹',
  [PARENT_IDS.LAUNDRY]:       '🧺',
  [PARENT_IDS.TAILORING]:     '✂️',
  [PARENT_IDS.GENERAL]:       '🛍️',
  [PARENT_IDS.CARGO]:         '🚚',
  [PARENT_IDS.USED]:          '♻️',
  // Food subcategories
  'Chakula Kilicho Tayari':   '🍲',
  'Wali na Nyama Choma':      '🍖',
  'Ugali na Samaki':          '🐟',
  'Mihogo na Kuku':           '🍗',
  'Chipsi na Maji':           '🍟',
  'Supu na Mboga':            '🥣',
  'Pilau na Biryani':         '🍚',
  'Kupikiwa Nyumbani (Wapishi)': '👩‍🍳',
  // Fresh produce
  'Mboga na Matunda':         '🥬',
  'Mboga':                    '🥬',
  'Matunda':                  '🍎',
  'Mchele na Maharage':       '🍚',
  'Hoho na Karoti':           '🌶️',
  'Vitunguu na Mboga Kavu':   '🧅',
  'Nyama na Samaki Fresh':    '🥩',
  'Milk na Dairy Products':   '🥛',
  // Laundry
  'Ufuaji na Usafishaji Nguo': '🧺',
  'Mama Fua':                 '👩‍🔧',
  'Kufuliwa Nyumbani':        '🏠',
  // Home & Garden
  'Usafi Nyumbani na Bustani': '🧹',
  // Tailoring
  'Ushonaji na Tailoring':    '✂️',
  'Nguo za Kiume':            '👔',
  'Nguo za Kike':             '👗',
  'Vazi la Harusi':           '👰',
  'Uniforms na Workwear':     '🦺',
  // General
  'Electronics':              '📱',
  'Vifaa vya Nyumbani':       '🏠',
  'Fanicha':                  '🛋️',
  'Vyombo vya Usafiri':       '🚗',
  'Vifaa vya Ujenzi (Hardware)': '🔨',
  'Mitandao na Simu':         '📡',
  'Vifaa vya Michezo':        '⚽',
  'Vitabu na Vifaa vya Masomo': '📚',
  // Used goods
  'Nguo za Used':             '👕',
  'Electronics za Used':      '📱',
  'Mitambo na Machine':       '⚙️',
  'Tools na Zana':            '🔧',
  'Fanicha za Used':          '🛋️',
  // Cargo
  'Cargo ya Ndani':           '📦',
  'Express Delivery':         '⚡',
  'Logistics ya Biashara':    '🏢',
  'Kukodisha Lori/Cherehe':   '🚛',
};

const CATEGORY_BG: Record<string, string> = {
  '🍲': '#ccfbf1', '🥬': '#dcfce7', '🍚': '#fef9c3', '✂️': '#fce7f3',
  '🧹': '#e0f2fe', '🧺': '#dbeafe', '🛍️': '#ddd6fe', '🚚': '#fef3c7',
  '♻️': '#fde68a', '🍖': '#fecaca', '🐟': '#bae6fd', '🍗': '#fed7aa',
  '🍟': '#fef9c3', '🥣': '#e0f2fe', '👩‍🍳': '#ffedd5',
  '🍎': '#fecdd3', '🌶️': '#fee2e2', '🧅': '#fef3c7', '🥩': '#fecaca', '🥛': '#f0f9ff',
  '👩‍🔧': '#dbeafe', '🏠': '#e0f2fe',
  '👔': '#dbeafe', '👗': '#fce7f3', '👰': '#fef3c7', '🦺': '#fef9c3',
  '📱': '#ddd6fe', '🛋️': '#fef3c7', '🚗': '#dbeafe', '🔨': '#d1fae5',
  '📡': '#e0e7ff', '⚽': '#dcfce7', '📚': '#fef9c3',
  '👕': '#fbcfe8', '⚙️': '#e2e8f0', '🔧': '#d1fae5',
  '📦': '#fef9c3', '⚡': '#fef3c7', '🏢': '#e0e7ff', '🚛': '#dbeafe',
};

const PARENT_ORDER: Record<string, number> = {
  [PARENT_IDS.FOOD_SERVICES]: 10,
  [PARENT_IDS.FRESH_PRODUCE]: 20,
  [PARENT_IDS.LAUNDRY]:       30,
  [PARENT_IDS.HOME_GARDEN]:   40,
  [PARENT_IDS.TAILORING]:     50,
  [PARENT_IDS.GENERAL]:       60,
  [PARENT_IDS.USED]:          70,
  [PARENT_IDS.CARGO]:         80,
};

const SUBCATEGORY_HINTS: Record<string, string> = {
  [PARENT_IDS.FOOD_SERVICES]: 'Wali · Nyama Choma · Ugali · Samaki · Chipsi · Pilau',
  [PARENT_IDS.FRESH_PRODUCE]: 'Mboga · Matunda · Mchele · Hoho · Karoti · Vitunguu',
  [PARENT_IDS.LAUNDRY]:       'Mama Fua · Kufuliwa Nyumbani',
  [PARENT_IDS.TAILORING]:     'Nguo za Kiume · Kike · Harusi · Uniforms',
  [PARENT_IDS.GENERAL]:       'Electronics · Vifaa · Fanicha · Vyombo · Hardware',
  [PARENT_IDS.USED]:          'Nguo · Electronics · Mitambo · Tools · Fanicha',
  [PARENT_IDS.CARGO]:         'Cargo · Express · Logistics · Kukodisha Lori',
};

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
  const firstNameLabel = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const isPhone = device.type === 'phone';
  const isSmallPhone = device.phoneSize === 'small';
  const heroMinHeight = isSmallPhone ? '160px' : isPhone ? '180px' : '220px';
  const heroPadding = isSmallPhone ? '1.5rem 1rem' : isPhone ? '1.75rem 1.25rem' : '2rem';

  // Only show parent categories (no parentId) that are active
  const parentCategories = (categories ?? [])
    .filter((c) => c.isActive && !c.parentId)
    .sort((a, b) => (PARENT_ORDER[a.id] ?? 999) - (PARENT_ORDER[b.id] ?? 999));

  function handleCategoryClick(cat: Category) {
    if (cat.id === PARENT_IDS.USED) {
      navigate('/used-goods');
    } else if (cat.id === PARENT_IDS.TAILORING) {
      navigate('/tailoring');
    } else if (cat.id === PARENT_IDS.CARGO) {
      navigate('/cargo');
    } else if (cat.id === PARENT_IDS.GENERAL) {
      navigate('/general-products');
    } else {
      navigate(`/vendors?category=${encodeURIComponent(cat.type)}&parentId=${cat.id}`);
    }
  }

  return (
    <div className="page" style={{ paddingTop: device.safeAreaInsets.top || undefined }}>
      {/* Hero welcome */}
      <section className="hero" style={{ borderRadius: 'var(--radius-lg)', marginBottom: isPhone ? '1rem' : '1.5rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: heroMinHeight, padding: heroPadding, textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: isSmallPhone ? '1.6rem' : 'clamp(1.9rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              Hello, <span className="hero-gradient">{firstNameLabel}</span>
            </h1>
            <p style={{ color: 'var(--muted)', margin: '0', fontSize: isSmallPhone ? '0.9rem' : '1.05rem' }}>Welcome back to afriMarket</p>
          </div>
        </div>
      </section>

      {/* Categories — right after hero */}
      <div className="section">
        <SectionTitle title={t('app.categories')} emoji="🛍️" />
        <div className="cat-scroll">
          {parentCategories.map((cat) => {
            const icon = cat.emoji || CATEGORY_ICONS[cat.id] || '🛍️';
            const hint = cat.tagline || SUBCATEGORY_HINTS[cat.id];
            return (
              <div key={cat.id} className="cat-tile" onClick={() => handleCategoryClick(cat)}>
                <div className="cat-emoji" style={{ background: CATEGORY_BG[icon] || 'var(--brand-soft)' }}>{icon}</div>
                <div className="cat-name">{cat.name}</div>
                {hint && (
                  <div className="cat-sub" style={{ fontSize: '0.58rem', color: 'var(--muted)', lineHeight: 1.2 }}>{hint}</div>
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

      {/* AI Smart Shopping List */}
      <button
        className="btn"
        onClick={() => navigate('/general-products')}
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
            Smart Shopping List
          </span>
          <span style={{ display: 'block', opacity: 0.85, fontSize: '0.85rem', marginTop: '0.15rem' }}>
            🛍️ AI Assistant · Eleza unachohitaji, tupa orodha yako
          </span>
        </span>
        <span style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: 700 }}>Anza →</span>
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
              <button className="btn btn-outline" onClick={() => navigate('/matangazo')}>📣 {t('nav.promotions')}</button>
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
