import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Vendor } from '../../types';

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
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: 0,
  },
  subtext: {
    color: '#64748b',
    marginTop: '0.25rem',
    fontSize: '0.95rem',
  },
  search: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.95rem',
    outline: 'none',
    background: '#ffffff',
    marginBottom: '1.5rem',
    boxSizing: 'border-box' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    transition: 'box-shadow 0.15s ease',
  },
  shopName: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  category: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#0f766e',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  description: {
    fontSize: '0.9rem',
    color: '#475569',
    lineHeight: 1.5,
    minHeight: '2.7rem',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
    fontSize: '0.8rem',
    color: '#64748b',
  },
  rating: {
    color: '#f59e0b',
    fontWeight: 600,
  },
  empty: {
    textAlign: 'center' as const,
    color: '#64748b',
    padding: '3rem 0',
  },
};

function VendorList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: vendors, loading, error } = useApi<Vendor[]>('/vendors', []);

  const filtered = (vendors || []).filter((v) =>
    v.shopName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Browse Vendors</h1>
        <div style={styles.subtext}>Discover local shops and products</div>
      </div>

      <input
        type="text"
        placeholder="Search vendors by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={styles.search}
      />

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div style={styles.empty}>No vendors found.</div>
          ) : (
            <div style={styles.grid}>
              {filtered.map((v) => (
                <div
                  key={v.id}
                  style={styles.card}
                  onClick={() => navigate(`/vendors/${v.id}/products`)}
                >
                  <div style={styles.category}>{v.category}</div>
                  <h3 style={styles.shopName}>{v.shopName}</h3>
                  <div style={styles.description}>{v.description}</div>
                  <div style={styles.meta}>
                    <span>
                      <span style={styles.rating}>★ {v.averageRating?.toFixed(1) || 'N/A'}</span>
                      {' · '}
                      {v.totalOrders} orders
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VendorList;