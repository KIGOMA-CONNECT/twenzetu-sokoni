import { useCurrency } from '../context/CurrencyContext';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, emoji }: { title: string; emoji?: string }) {
  return (
    <h2 className="section-title">
      {emoji && <span>{emoji}</span>}
      {title}
    </h2>
  );
}

export function EmptyState({ icon = '📦', title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}

interface ProductCardProps {
  name: string;
  price: number;
  oldPrice?: number;
  vendor?: string;
  imageUrl?: string;
  rating?: number | string | null;
  stockQuantity?: number;
  unit?: string;
  onClick?: () => void;
  actionLabel?: string;
  discount?: number;
}

export function ProductCard({
  name,
  price,
  oldPrice,
  vendor,
  imageUrl,
  rating,
  stockQuantity,
  unit,
  onClick,
  actionLabel = 'Add',
  discount,
}: ProductCardProps) {
  const { formatCurrency } = useCurrency();
  const showDiscount = discount != null && discount > 0;
  return (
    <div className="pcard" onClick={onClick}>
      {showDiscount && <span className="discount-badge">-{discount}%</span>}
      <div className="pcard-img">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" />
        ) : (
          <span>{(name || '📦').charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">{name}</div>
        {vendor && <div className="pcard-vendor">🏪 {vendor}</div>}
        {rating != null && Number(rating) > 0 && (
          <div className="rating">★ {Number(rating).toFixed(1)}</div>
        )}
        <div className="pcard-price-row">
          <span className="pcard-price">{formatCurrency(price)}</span>
          {oldPrice != null && oldPrice > price && <span className="pcard-price-old">{formatCurrency(oldPrice)}</span>}
        </div>
        {stockQuantity != null && stockQuantity > 0 && unit && (
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            {stockQuantity} {unit} in stock
          </div>
        )}
        <button
          className="btn btn-primary btn-sm add-btn"
          style={{ width: '100%' }}
          disabled={stockQuantity != null && stockQuantity <= 0}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          {stockQuantity != null && stockQuantity <= 0 ? 'Unavailable' : actionLabel}
        </button>
      </div>
    </div>
  );
}

export function VendorCard({
  shopName,
  category,
  description,
  rating,
  totalOrders,
  status,
  onClick,
}: {
  shopName: string;
  category?: string;
  description?: string;
  rating?: number;
  totalOrders?: number;
  status?: string;
  onClick?: () => void;
}) {
  return (
    <div className="card card-hover" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ width: 52, height: 52, borderRadius: 'var(--radius)', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
          🏪
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shopName}</div>
          {category && <div className="badge badge-brand" style={{ marginTop: 3 }}>{category}</div>}
        </div>
      </div>
      {description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--muted)' }}>
        <span className="rating">★ {rating?.toFixed(1) ?? 'N/A'}</span>
        <span>{totalOrders ?? 0} orders</span>
        {status && (
          <span className={`badge ${status === 'ACTIVE' ? 'badge-green' : status === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>
            {status.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    </div>
  );
}
