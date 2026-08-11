import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Product, PosPaymentMethod, PosCheckoutResult } from '../../types';

interface CartLine {
  product: Product;
  quantity: number;
}

const PAYMENT_METHODS: { value: PosPaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'tigo_pesa', label: 'Tigo Pesa' },
  { value: 'tigo_money', label: 'Tigo Money' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'halotel', label: 'Halotel' },
  { value: 'azampesa', label: 'Airtel Azam Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'wallet', label: 'Wallet' },
];

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', maxWidth: '1500px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  searchRow: { display: 'flex', gap: '0.6rem', marginBottom: '1rem' },
  search: { flex: 1, padding: '0.7rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit' },
  scan: { flex: 1.4, padding: '0.7rem 0.9rem', border: '2px solid #1e40af', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit' },
  layout: { display: 'flex', gap: '1rem', flex: 1, minHeight: 0 },
  grid: { flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.65rem', alignContent: 'start', padding: '2px' },
  tile: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tileDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  tileName: { fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', lineHeight: 1.2, marginBottom: '0.25rem' },
  tileSku: { fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem' },
  tilePrice: { color: '#1e40af', fontWeight: 700, fontSize: '0.95rem' },
  tileStock: { fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' },
  cart: { width: '370px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  cartHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, color: '#0f172a' },
  cartItems: { flex: 1, overflowY: 'auto', padding: '0.6rem 1rem' },
  cartRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px dashed #f1f5f9', gap: '0.5rem' },
  cartInfo: { flex: 1, minWidth: 0 },
  cartName: { fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cartSub: { fontSize: '0.72rem', color: '#64748b' },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '0.35rem' },
  qtyBtn: { width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, color: '#334155' },
  qtyValue: { minWidth: 22, textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' },
  cartLineTotal: { width: 70, textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' },
  cartFooter: { padding: '0.8rem 1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.7rem' },
  payBtn: { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' },
  payBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  emptyCart: { color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '400px', maxWidth: '92vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  bigTotal: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.6rem 0.9rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#15803d', marginBottom: '0.85rem' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#334155' },
  saveBtn: { padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 },
  smallError: { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' },
  receipt: { background: '#fff', borderRadius: '12px', padding: '1.25rem', width: '380px', maxWidth: '92vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  receiptPre: { whiteSpace: 'pre-wrap', fontFamily: '"Courier New", monospace', fontSize: '0.8rem', lineHeight: 1.5, color: '#0f172a', background: '#fff', border: '1px dashed #e2e8f0', padding: '0.8rem', maxHeight: '55vh', overflow: 'auto' },
  receiptMsg: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.85rem', marginBottom: '0.8rem', fontWeight: 600 },
};

export default function VendorPos() {
  const { refreshVendorAccess } = useAuth();
  const { data: raw, loading, error, refetch } = useApi<Product[]>('/pos/products');
  const products: Product[] = Array.isArray(raw) ? raw : [];
  const [query, setQuery] = useState('');
  const [scan, setScan] = useState('');
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [payOpen, setPayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [saving, setSaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PosCheckoutResult | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scanRef.current?.focus();
  }, [payOpen, receipt]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q) ||
      (p.barcode ?? '').toLowerCase().includes(q),
    );
  }, [products, query]);

  const cartList = Object.values(cart);
  const total = cartList.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  const addToCart = (product: Product, qty = 1) => {
    const existing = cart[product.id];
    const next = (existing?.quantity ?? 0) + qty;
    if (next > product.stockQuantity) {
      alert(`Only ${product.stockQuantity} in stock for ${product.name}.`);
      return;
    }
    setCart((prev) => ({ ...prev, [product.id]: { product, quantity: next } }));
  };

  const setQty = (productId: string, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        const line = next[productId];
        if (line) next[productId] = { ...line, quantity: Math.min(qty, line.product.stockQuantity) };
      }
      return next;
    });
  };

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const code = scan.trim().toLowerCase();
    if (!code) return;
    const match = products.find((p) =>
      (p.sku ?? '').toLowerCase() === code || (p.barcode ?? '').toLowerCase() === code,
    );
    setScan('');
    if (!match) {
      alert(`No product found for "${scan.trim()}".`);
      return;
    }
    addToCart(match);
  };

  const openPay = () => {
    if (cartList.length === 0) return;
    setAmountTendered('');
    setPayError(null);
    setPaymentMethod('cash');
    setPayOpen(true);
  };

  const submitCheckout = async () => {
    const items = cartList.map((l) => ({ productId: l.product.id, quantity: l.quantity }));
    const tendered = amountTendered.trim() ? Number(amountTendered) : undefined;
    if (paymentMethod === 'cash' && tendered !== undefined && tendered < total) {
      setPayError('Amount tendered is less than the total.');
      return;
    }
    setSaving(true);
    setPayError(null);
    try {
      const res = await api.post('/pos/checkout', {
        items,
        paymentMethod,
        amountTendered: tendered,
      });
      const payload = res.data?.data ?? res.data;
      setReceipt(payload);
      setCart({});
      setPayOpen(false);
    } catch (err: any) {
      setPayError(err.response?.data?.message || err.message || 'Checkout failed.');
    } finally {
      setSaving(false);
    }
  };

  const doneReceipt = async () => {
    setReceipt(null);
    await refetch();
    await refreshVendorAccess();
    scanRef.current?.focus();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Point of Sale</h1>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Scan or tap a product to ring it up</div>
        </div>
        {cartList.length > 0 && (
          <button style={{ ...styles.cancelBtn, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setCart({})}>
            Clear Cart
          </button>
        )}
      </div>

      <div style={styles.searchRow}>
        <input
          style={styles.search}
          placeholder="Search products by name, SKU or barcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          ref={scanRef}
          style={styles.scan}
          placeholder="Scan barcode / type code + Enter"
          value={scan}
          onChange={(e) => setScan(e.target.value)}
          onKeyDown={handleScan}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div style={styles.layout}>
          <div style={styles.grid}>
            {filtered.length === 0 && (
              <div style={{ color: '#94a3b8', padding: '2rem', gridColumn: '1 / -1', textAlign: 'center' }}>
                No products found. Add products with stock first.
              </div>
            )}
            {filtered.map((p) => {
              const out = p.status !== 'ACTIVE' || p.stockQuantity <= 0;
              return (
                <button
                  key={p.id}
                  style={{ ...styles.tile, ...(out ? styles.tileDisabled : {}) }}
                  disabled={out}
                  onClick={() => addToCart(p)}
                >
                  <div style={styles.tileName}>{p.name}</div>
                  <div style={styles.tileSku}>{p.sku || p.barcode || p.id.slice(0, 8)}</div>
                  <div style={styles.tilePrice}>{fmt(p.price)} {p.currency}</div>
                  <div style={styles.tileStock}>
                    {out ? (p.status !== 'ACTIVE' ? <StatusBadge status={p.status} /> : 'Out of stock') : `${p.stockQuantity} in stock`}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={styles.cart}>
            <div style={styles.cartHeader}>Current Sale</div>
            <div style={styles.cartItems}>
              {cartList.length === 0 && <div style={styles.emptyCart}>No items yet</div>}
              {cartList.map((l) => (
                <div key={l.product.id} style={styles.cartRow}>
                  <div style={styles.cartInfo}>
                    <div style={styles.cartName}>{l.product.name}</div>
                    <div style={styles.cartSub}>{fmt(l.product.price)} each</div>
                  </div>
                  <div style={styles.qtyControls}>
                    <button style={styles.qtyBtn} onClick={() => setQty(l.product.id, l.quantity - 1)}>−</button>
                    <span style={styles.qtyValue}>{l.quantity}</span>
                    <button style={styles.qtyBtn} onClick={() => addToCart(l.product)}>+</button>
                  </div>
                  <div style={styles.cartLineTotal}>{fmt(l.product.price * l.quantity)}</div>
                </div>
              ))}
            </div>
            <div style={styles.cartFooter}>
              <div style={styles.totalRow}>
                <span>TOTAL</span>
                <span>{fmt(total)}</span>
              </div>
              <button style={{ ...styles.payBtn, ...(total <= 0 ? styles.payBtnDisabled : {}) }} disabled={total <= 0} onClick={openPay}>
                Charge {total > 0 ? fmt(total) : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {payOpen && (
        <div style={styles.overlay} onClick={() => !saving && setPayOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Take Payment</div>
            <div style={styles.bigTotal}>
              <span>Total Due</span>
              <span>{fmt(total)}</span>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Payment Method</label>
              <select style={styles.input} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PosPaymentMethod)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            {paymentMethod === 'cash' && (
              <div style={styles.field}>
                <label style={styles.label}>Amount Tendered</label>
                <input
                  style={styles.input}
                  type="number"
                  min={total}
                  value={amountTendered}
                  placeholder={String(total)}
                  onChange={(e) => setAmountTendered(e.target.value)}
                />
              </div>
            )}
            {payError && <div style={styles.smallError}>{payError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setPayOpen(false)} disabled={saving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving ? { opacity: 0.6 } : {}) }} onClick={submitCheckout} disabled={saving}>
                {saving ? 'Processing…' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div style={styles.overlay}>
          <div style={styles.receipt} id="receipt-print">
            <div style={styles.receiptMsg}>Sale complete — receipt #{receipt.sale.saleNumber}</div>
            <pre style={styles.receiptPre}>{receipt.receiptText}</pre>
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={doneReceipt}>Done</button>
              <button style={styles.saveBtn} onClick={() => window.print()}>Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}