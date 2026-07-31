import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Recommendations } from '../../components/Recommendations';
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
  'Chakula Kilicho Tayari': '🍽️',
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

function categoryIcon(category: Category): string {
  return CATEGORY_ICONS[category.name] ?? TYPE_ICONS[category.type] ?? '🛍️';
}

const styles = {
  page: {
    padding: '1.5rem',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '1.5rem',
  },
  greeting: {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: 0,
  },
  subtext: {
    color: '#64748b',
    marginTop: '0.25rem',
    fontSize: '0.95rem',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  statLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f766e',
    marginTop: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  },
  quickLinks: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  button: {
    padding: '0.625rem 1.25rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  primaryBtn: {
    background: '#0f766e',
    color: '#ffffff',
  },
  secondaryBtn: {
    background: '#ffffff',
    color: '#0f766e',
    border: '1px solid #0f766e',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  categoryCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
  },
  categoryIcon: {
    fontSize: '1.75rem',
  },
  categoryName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    textAlign: 'center' as const,
    color: '#0f172a',
  },
};

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

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.greeting}>{t('app.welcome')}, {user?.fullName?.split(' ')[0] || 'there'}</h1>
        <div style={styles.subtext}>{t('app.welcomeBack')}</div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          <div style={styles.stats}>
            <div style={styles.card}>
            <div style={styles.statLabel}>{t('app.activeOrders')}</div>
            <div style={styles.statValue}>{activeOrders}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.statLabel}>{t('app.totalSpent')}</div>
              <div style={styles.statValue}>{formatCurrency(totalSpent)}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.statLabel}>{t('app.loyaltyPoints')}</div>
              <div style={styles.statValue}>{loyaltyPoints}</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>{t('app.categories')}</div>
            <div style={styles.categoryGrid}>
              {(categories ?? []).map((category) => (
                <div
                  key={category.id}
                  style={styles.categoryCard}
                  onClick={() => navigate('/catalog')}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={styles.categoryIcon}>{categoryIcon(category)}</span>
                  <span style={styles.categoryName}>{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>{t('app.quickLinks')}</div>
            <div style={styles.quickLinks}>
              <button
                style={{ ...styles.button, ...styles.primaryBtn }}
                onClick={() => navigate('/catalog')}
              >
                🛒 {t('catalog.title')}
              </button>
              <button
                style={{ ...styles.button, ...styles.secondaryBtn }}
                onClick={() => navigate('/vendors')}
              >
                {t('app.browseVendors')}
              </button>
              <button
                style={{ ...styles.button, ...styles.secondaryBtn }}
                onClick={() => navigate('/orders')}
              >
                Order History
              </button>
              <button
                style={{ ...styles.button, ...styles.primaryBtn }}
                onClick={() => navigate('/referrals')}
              >
                Refer a Friend
              </button>
              <button
                style={{ ...styles.button, ...styles.secondaryBtn }}
                onClick={() => navigate('/subscriptions')}
              >
                Subscriptions
              </button>
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