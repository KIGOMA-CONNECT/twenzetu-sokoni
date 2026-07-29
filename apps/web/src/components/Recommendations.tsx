import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingSpinner } from './LoadingSpinner';
import type { Product } from '../types';

const styles = {
  section: {
    marginTop: '1.5rem',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  name: {
    fontSize: '0.9rem',
    fontWeight: 600,
    margin: 0,
    color: '#0f172a',
  },
  price: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#0f766e',
    marginTop: '0.3rem',
  },
  vendor: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.2rem',
  },
};

interface RecommendationsProps {
  title?: string;
  endpoint: string;
  vendorMap?: Record<string, string>;
}

export function Recommendations({ title = 'Recommended', endpoint, vendorMap = {} }: RecommendationsProps) {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(endpoint)
      .then((res) => setItems(res.data?.data || res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  if (loading) return <LoadingSpinner />;
  if (items.length === 0) return null;

  return (
    <div style={styles.section}>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.grid}>
        {items.slice(0, 6).map((item: any) => (
          <div
            key={item.id}
            style={styles.card}
            onClick={() => navigate(`/vendors/${item.vendor_id}/products`)}
          >
            <div style={styles.name}>{item.name}</div>
            <div style={styles.price}>{formatCurrency(Number(item.price))}</div>
            {item.vendor_id && vendorMap[item.vendor_id] && (
              <div style={styles.vendor}>{vendorMap[item.vendor_id]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
