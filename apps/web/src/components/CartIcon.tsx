import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

export function CartIcon({ onSurface = false }: { onSurface?: boolean }) {
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => navigate('/cart')}
      className="icon-btn"
      aria-label={t('cart.title')}
      style={onSurface ? { color: 'var(--text)' } : {}}
    >
      🛒
      {itemCount > 0 && <span className="count">{itemCount > 9 ? '9+' : itemCount}</span>}
    </button>
  );
}
