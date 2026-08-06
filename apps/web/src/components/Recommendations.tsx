import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { LoadingSpinner } from './LoadingSpinner';
import { ProductCard } from './ui';

const styles = {
  section: {
    marginTop: '1.5rem',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--ink)',
    marginBottom: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '0.9rem',
  },
};

interface RecommendationsProps {
  title?: string;
  endpoint: string;
  vendorMap?: Record<string, string>;
}

interface RecommendationItem {
  id: string;
  name?: string;
  price?: number | string;
  old_price?: number | string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  vendor_id?: string;
  vendor_name?: string;
  rating?: number | null;
  averageRating?: number | null;
  stock_quantity?: number | null;
  stockQuantity?: number | null;
  unit?: string | null;
}

export function Recommendations({ title = 'Recommended', endpoint, vendorMap = {} }: RecommendationsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(endpoint)
      .then((res) => {
        const payload = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.data;
        setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  if (loading) return <LoadingSpinner />;
  if (items.length === 0) return null;

  return (
    <div style={styles.section}>
      <h3 style={styles.title}>
        <span>✨</span>
        {title}
      </h3>
      <div style={styles.grid}>
        {items.slice(0, 6).map((item) => (
          <ProductCard
            key={item.id}
            name={item.name}
            price={Number(item.price ?? 0)}
            oldPrice={item.old_price != null ? Number(item.old_price) : undefined}
            imageUrl={item.image_url || item.imageUrl || undefined}
            vendor={vendorMap[item.vendor_id ?? ''] || item.vendor_name}
            rating={item.rating ?? item.averageRating ?? undefined}
            stockQuantity={item.stock_quantity ?? item.stockQuantity ?? undefined}
            unit={item.unit ?? undefined}
            actionLabel={t('product.placeOrder')}
            onClick={() => navigate(`/vendors/${item.vendor_id}/products`)}
          />
        ))}
      </div>
    </div>
  );
}
