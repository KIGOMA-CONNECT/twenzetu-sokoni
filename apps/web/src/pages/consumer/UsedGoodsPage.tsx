import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../context/CartContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, ProductCard } from '../../components/ui';
import type { Category, Product } from '../../types';

const USED_PARENT_ID = 'd0000000-0000-0000-0000-000000000018';

const SUBCAT_ICONS: Record<string, string> = {
  'Nguo za Used': '👕',
  'Electronics za Used': '📱',
  'Mitambo na Machine': '⚙️',
  'Tools na Zana': '🔧',
  'Fanicha za Used': '🛋️',
};

const SUBCAT_BG: Record<string, string> = {
  '👕': '#fbcfe8',
  '📱': '#ddd6fe',
  '⚙️': '#e2e8f0',
  '🔧': '#d1fae5',
  '🛋️': '#fef3c7',
};

export default function UsedGoodsPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [cartError, setCartError] = useState<string | null>(null);
  const { data: categories, loading: catsLoading, error: catsError } = useApi<Category[]>('/public/categories', []);
  const { addItem, setActiveVendor } = useCart();

  const subcategories = (categories ?? []).filter((c) => c.parentId === USED_PARENT_ID);
  const selectedCat = subcategories.find((c) => c.id === categoryId);

  const { data: products, loading: prodsLoading, error: prodsError } = useApi<Product[]>(
    categoryId ? `/public/products?categoryId=${categoryId}` : null,
    [categoryId],
  );

  const handleAdd = async (p: Product) => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    setCartError(null);
    try {
      setActiveVendor(p.vendorId);
      await addItem(p.id);
    } catch (err: any) {
      setCartError(err?.response?.data?.message || err?.message || 'Imeshindikana kuongeza kwenye kikapu');
    }
  };

  if (catsLoading) return <LoadingSpinner />;
  if (catsError) return <ErrorMessage message={catsError} />;

  if (categoryId) {
    return (
      <div className="page">
        <PageHeader
          title={`${SUBCAT_ICONS[selectedCat?.name ?? ''] ?? '♻️'} ${selectedCat?.name || 'Vitu vya Used'}`}
          subtitle="Chagua bidhaa unazohitaji"
        />
        <button
          className="btn btn-ghost mb-2"
          onClick={() => navigate('/used-goods')}
          style={{ fontSize: '0.85rem' }}
        >
          ‹ Rudi kwenye subcategories
        </button>
        {cartError && (
          <div className="card" style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '0.85rem', padding: '0.7rem 1rem', marginBottom: '1rem' }}>
            ⚠️ {cartError}
          </div>
        )}
        {prodsLoading && <LoadingSpinner />}
        {prodsError && <ErrorMessage message={prodsError} />}
        {!prodsLoading && !prodsError && (
          (products ?? []).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
              Hakuna bidhaa kwenye subcategory hii bado.
            </div>
          ) : (
            <div className="grid grid-auto-sm">
              {(products ?? []).map((p) => (
                <ProductCard
                  key={p.id}
                  name={p.name}
                  price={p.price}
                  imageUrl={p.imageUrl}
                  stockQuantity={p.stockQuantity}
                  unit={p.unit}
                  actionLabel={p.stockQuantity <= 0 ? 'Unavailable' : 'Add'}
                  onClick={() => handleAdd(p)}
                />
              ))}
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="♻️ Vitu vya Used" subtitle="Chagua aina ya bidhaa za used" />
      <div className="grid grid-auto-lg" style={{ marginTop: '1.5rem' }}>
        {subcategories.map((cat) => {
          const icon = SUBCAT_ICONS[cat.name] ?? '♻️';
          return (
            <div
              key={cat.id}
              className="cat-tile"
              onClick={() => navigate(`/used-goods/${cat.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="cat-emoji" style={{ background: SUBCAT_BG[icon] || 'var(--brand-soft)' }}>{icon}</div>
              <div className="cat-name">{cat.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}