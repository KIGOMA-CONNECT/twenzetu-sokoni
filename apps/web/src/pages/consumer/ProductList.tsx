import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Product, Address } from '../../types';

interface CartItem extends Product {
  quantity: number;
}

const styles = {
  page: {
    padding: '1.5rem',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
  },
  header: {
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  name: {
    fontSize: '1.05rem',
    fontWeight: 700,
    margin: 0,
  },
  description: {
    fontSize: '0.85rem',
    color: '#475569',
    lineHeight: 1.5,
    minHeight: '2.55rem',
  },
  price: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#0f766e',
  },
  stock: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  orderBtn: {
    marginTop: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: '#0f766e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  disabledBtn: {
    background: '#cbd5e1',
    cursor: 'not-allowed',
  },
  cart: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    position: 'sticky' as const,
    top: '1rem',
  },
  cartTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    margin: '0 0 1rem 0',
  },
  emptyCart: {
    color: '#64748b',
    fontSize: '0.9rem',
    textAlign: 'center' as const,
    padding: '1.5rem 0',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.85rem',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: 0,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 700,
    fontSize: '1rem',
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '2px solid #e2e8f0',
  },
  checkoutBtn: {
    width: '100%',
    marginTop: '1rem',
    padding: '0.7rem 1rem',
    background: '#0f766e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  notice: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    marginBottom: '0.75rem',
  },
};

function ProductList() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { data: products, loading, error } = useApi<Product[]>(
    `/products?vendorId=${vendorId}`,
    [vendorId]
  );
  const { data: addresses } = useApi<Address[]>('/addresses/me');

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`cart-${vendorId}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(`cart-${vendorId}`, JSON.stringify(cart));
  }, [cart, vendorId]);

  const addToCart = (product: Product) => {
    setCartError(null);
    setCartSuccess(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const decrement = (productId: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const checkout = async () => {
    if (!vendorId) return;
    const selectedAddr = addresses?.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setCartError('Please select a delivery address before checkout.');
      return;
    }
    setCartError(null);
    setCartSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/orders', {
        vendorId,
        type: 'general',
        items: cart.map((i) => ({
          productId: i.id,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        deliveryAddress: selectedAddr.fullAddress,
      });
      setCart([]);
      localStorage.removeItem(`cart-${vendorId}`);
      setCartSuccess('Order placed successfully!');
      setTimeout(() => navigate('/orders'), 1200);
    } catch (err: any) {
      setCartError(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Products</h1>
        <div style={styles.subtext}>Browse and place an order from this vendor</div>
      </div>

      <div style={styles.layout} className="responsive-grid-2col">
        <div>
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && (
            <>
              {products && products.length === 0 ? (
                <div style={{ color: '#64748b', padding: '2rem 0' }}>
                  No products available from this vendor.
                </div>
              ) : (
                <div style={styles.grid}>
                  {products?.map((p) => (
                    <div key={p.id} style={styles.card}>
                      <h3 style={styles.name}>{p.name}</h3>
                      <div style={styles.description}>{p.description}</div>
                      <div style={styles.price}>
                        {formatCurrency(p.price)}
                      </div>
                      <div style={styles.stock}>
                        {p.stockQuantity > 0
                          ? `In stock: ${p.stockQuantity} ${p.unit}`
                          : 'Out of stock'}
                      </div>
                      <StatusBadge status={p.status} />
                      <button
                        style={{
                          ...styles.orderBtn,
                          ...(p.stockQuantity <= 0 ? styles.disabledBtn : {}),
                        }}
                        disabled={p.stockQuantity <= 0}
                        onClick={() => addToCart(p)}
                      >
                        {p.stockQuantity <= 0 ? 'Unavailable' : 'Place Order'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.cart}>
          <h2 style={styles.cartTitle}>Cart ({cart.length})</h2>

          {cartError && (
            <div style={{ ...styles.notice, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {cartError}
            </div>
          )}
          {cartSuccess && (
            <div style={{ ...styles.notice, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              {cartSuccess}
            </div>
          )}

          {cart.length === 0 ? (
            <div style={styles.emptyCart}>Your cart is empty</div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} style={styles.cartItem}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      style={{ ...styles.removeBtn, color: '#475569' }}
                      onClick={() => decrement(item.id)}
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                    <button
                      style={{ ...styles.removeBtn, color: '#475569' }}
                      onClick={() => addToCart(item)}
                    >
                      +
                    </button>
                    <button style={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div style={styles.totalRow}>
                <span>Total</span>
                <span>
                  {formatCurrency(total)}
                </span>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Delivery Address *
                </label>
                {addresses && addresses.length > 0 ? (
                  <select
                    style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    <option value="">Select address...</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>{addr.label} — {addr.fullAddress}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    No addresses saved. <a href="/addresses" style={{ color: '#1e40af' }}>Add one</a> before checkout.
                  </div>
                )}
              </div>
              <button
                style={{
                  ...styles.checkoutBtn,
                  opacity: submitting ? 0.7 : 1,
                }}
                disabled={submitting}
                onClick={checkout}
              >
                {submitting ? 'Placing order...' : 'Checkout'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductList;