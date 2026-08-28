import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import AiAssistant from '../../components/AiAssistant';
import type { Product, PosPaymentMethod, PosCheckoutResult, PosShift } from '../../types';
import { PageTitle } from '../../components/PageTitle';

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



const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', height: 'calc(100vh - 130px)', display: 'flex', flexDirection: 'column', maxWidth: '1500px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  searchRow: { display: 'flex', gap: '0.6rem', marginBottom: '1rem' },
  search: { flex: 1, padding: '0.7rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit' },
  scan: { flex: 1.4, padding: '0.7rem 0.9rem', border: '2px solid #1e40af', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit' },
  layout: { display: 'flex', gap: '1rem', flex: 1, minHeight: 0 },
  grid: { flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.65rem', alignContent: 'start', padding: '2px' },
  tile: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px', padding: '0.7rem', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tileDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  tileName: { fontWeight: 700, color: 'var(--ink)', fontSize: '0.85rem', lineHeight: 1.2, marginBottom: '0.25rem' },
  tileSku: { fontSize: '0.7rem', color: 'var(--faint)', marginBottom: '0.3rem' },
  tilePrice: { color: '#1e40af', fontWeight: 700, fontSize: '0.95rem' },
  tileStock: { fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' },
  cart: { width: '370px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  cartHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid var(--line)', background: 'var(--bg)', fontWeight: 700, color: 'var(--ink)' },
  cartItems: { flex: 1, overflowY: 'auto', padding: '0.6rem 1rem' },
  cartRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px dashed #f1f5f9', gap: '0.5rem' },
  cartInfo: { flex: 1, minWidth: 0 },
  cartName: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cartSub: { fontSize: '0.72rem', color: 'var(--muted)' },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '0.35rem' },
  qtyBtn: { width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: 'var(--surface)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, color: 'var(--text)' },
  qtyValue: { minWidth: 22, textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)' },
  cartLineTotal: { width: 70, textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' },
  cartFooter: { padding: '0.8rem 1rem', borderTop: '1px solid var(--line)', background: 'var(--bg)' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '0.7rem' },
  payBtn: { width: '100%', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' },
  payBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  emptyCart: { color: 'var(--faint)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '400px', maxWidth: '92vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  bigTotal: { background: 'var(--success-soft)', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.6rem 0.9rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#15803d', marginBottom: '0.85rem' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' },
  saveBtn: { padding: '0.5rem 1rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 },
  smallError: { color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' },
  receipt: { background: 'var(--surface)', borderRadius: '12px', padding: '1.25rem', width: '380px', maxWidth: '92vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  receiptPre: { whiteSpace: 'pre-wrap', fontFamily: '"Courier New", monospace', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--ink)', background: 'var(--surface)', border: '1px dashed #e2e8f0', padding: '0.8rem', maxHeight: '55vh', overflow: 'auto' },
  receiptMsg: { background: 'var(--success-soft)', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.85rem', marginBottom: '0.8rem', fontWeight: 600 },
};

export default function VendorPos() {
  const { t } = useTranslation();
  const { refreshVendorAccess } = useAuth();
  const { formatCurrency } = useCurrency();
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
  const [shift, setShift] = useState<PosShift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [shiftModal, setShiftModal] = useState<'open' | 'close' | null>(null);
  const [openingFloat, setOpeningFloat] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftSaving, setShiftSaving] = useState(false);
  const [, setPosError] = useState<string | null>(null);
  const [, setPosSuccess] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  const fetchShift = useCallback(async () => {
    try {
      setShiftLoading(true);
      const res = await api.get('/pos/shifts/current');
      setShift(res.data?.data ?? null);
      setShiftError(null);
    } catch (err: any) {
      setShiftError(err.response?.data?.message || 'Failed to load shift status.');
    } finally {
      setShiftLoading(false);
    }
  }, []);

  useEffect(() => { fetchShift(); }, [fetchShift]);

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

  const posContext = useMemo(() => {
    const facts: Record<string, unknown> = {
      shiftNumber: shift?.shiftNumber ?? '(no active shift)',
      shiftStatus: shift ? 'open' : 'closed',
      salesCount: shift?.salesCount ?? 0,
      totalSales: shift?.totalSales ?? 0,
      cartItemCount: cartList.length,
      cartTotal: total,
      filteredProducts: filtered.length,
      totalProducts: products.length,
    };
    const rows = [
      ...cartList.slice(0, 20).map((l) => ({ kind: 'cart', name: l.product.name, quantity: l.quantity, price: l.product.price, total: l.product.price * l.quantity })),
      ...filtered.slice(0, 20).map((p) => ({ kind: 'product', name: p.name, price: p.price, stockQuantity: p.stockQuantity, sku: p.sku })),
    ];
    return { summary: `POS — ${shift ? `shift ${shift.shiftNumber}` : 'no shift'} — ${cartList.length} cart items`, facts, rows, constraints: ['Ground in shift and cart.'] };
  }, [shift, cartList, total, filtered, products.length]);

  const addToCart = (product: Product, qty = 1) => {
    const existing = cart[product.id];
    const next = (existing?.quantity ?? 0) + qty;
    if (next > product.stockQuantity) {
      setPosError(`Only ${product.stockQuantity} in stock for ${product.name}.`);
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
      setPosError(`No product found for "${code}".`);
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

  const openShift = async () => {
    setShiftSaving(true);
    try {
      const res = await api.post('/pos/shifts/open', {
        openingFloat: openingFloat.trim() ? Number(openingFloat) : 0,
      });
      setShift(res.data?.data ?? null);
      setShiftModal(null);
      setOpeningFloat('');
    } catch (err: any) {
      setShiftError(err.response?.data?.message || 'Failed to open shift.');
    } finally {
      setShiftSaving(false);
    }
  };

  const closeShift = async () => {
    if (!closingCash.trim()) return;
    setShiftSaving(true);
    try {
      const res = await api.post('/pos/shifts/close', {
        closingCash: Number(closingCash),
        notes: shiftNotes.trim() || undefined,
      });
      setShift(null);
      setShiftModal(null);
      setClosingCash('');
      setShiftNotes('');
      // Show summary briefly then refresh
      setPosSuccess(`Shift closed! Sales: ${(res.data?.data?.totalSales ?? 0).toLocaleString()} | Variance: ${(res.data?.data?.cashVariance ?? 0).toLocaleString()}`);
      setTimeout(() => setPosSuccess(null), 5000);
    } catch (err: any) {
      setShiftError(err.response?.data?.message || 'Failed to close shift.');
    } finally {
      setShiftSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <PageTitle title="Point of Sale" />
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('vendor.pos')}</h1>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('vendor.posPage.scanPlaceholder')}</div>
        </div>
        {cartList.length > 0 && (
          <button style={{ ...styles.cancelBtn, color: 'var(--danger)', borderColor: '#fecaca' }} onClick={() => setCart({})}>
            {t('vendor.posPage.clearCart')}
          </button>
        )}
      </div>

      {/* Shift Status Banner */}
      {shiftLoading ? (
        <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>{t('vendor.posPage.loadingShift')}</div>
      ) : shiftError ? (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{shiftError}</div>
      ) : !shift ? (
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>{t('vendor.posPage.shiftClosed')}</div>
            <div style={{ color: '#a16207', fontSize: '0.82rem' }}>{t('vendor.posPage.openShiftToStart')}</div>
          </div>
          <button style={{ background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setShiftModal('open'); setOpeningFloat(''); }}>{t('vendor.posPage.openShift')}</button>
        </div>
      ) : (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '0.6rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span><strong>{t('vendor.posPage.shift')}</strong> {shift.shiftNumber}</span>
            <span><strong>{t('vendor.posPage.opened')}</strong> {new Date(shift.openedAt).toLocaleTimeString()}</span>
            <span><strong>{t('vendor.posPage.sales')}</strong> {shift.salesCount}</span>
            <span><strong>{t('vendor.posPage.total')}</strong> {shift.totalSales.toLocaleString()}</span>
          </div>
          <button style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setShiftModal('close'); setClosingCash(''); setShiftNotes(''); }}>{t('vendor.posPage.closeShift')}</button>
        </div>
      )}

      <div style={styles.searchRow}>
        <input
          style={styles.search}
          placeholder={t('vendor.posPage.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          ref={scanRef}
          style={styles.scan}
          placeholder={t('vendor.posPage.scanPlaceholder')}
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
        <>
          <div style={styles.layout}>
            <div style={styles.grid}>
              {filtered.length === 0 && (
                <div style={{ color: 'var(--faint)', padding: '2rem', gridColumn: '1 / -1', textAlign: 'center' }}>
                  {t('vendor.posPage.noProducts')}
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
                    <div style={styles.tilePrice}>{formatCurrency(p.price)} {p.currency}</div>
                    <div style={styles.tileStock}>
                      {out ? (p.status !== 'ACTIVE' ? <StatusBadge status={p.status} /> : t('vendor.posPage.outOfStock')) : `${p.stockQuantity} ${t('vendor.posPage.inStock')}`}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={styles.cart}>
              <div style={styles.cartHeader}>{t('vendor.posPage.currentSale')}</div>
              <div style={styles.cartItems}>
                {cartList.length === 0 && <div style={styles.emptyCart}>{t('vendor.posPage.noItemsYet')}</div>}
                {cartList.map((l) => (
                  <div key={l.product.id} style={styles.cartRow}>
                    <div style={styles.cartInfo}>
                      <div style={styles.cartName}>{l.product.name}</div>
                      <div style={styles.cartSub}>{formatCurrency(l.product.price)} {t('vendor.posPage.each')}</div>
                    </div>
                    <div style={styles.qtyControls}>
                      <button style={styles.qtyBtn} onClick={() => setQty(l.product.id, l.quantity - 1)}>âˆ’</button>
                      <span style={styles.qtyValue}>{l.quantity}</span>
                      <button style={styles.qtyBtn} onClick={() => addToCart(l.product)}>+</button>
                    </div>
                    <div style={styles.cartLineTotal}>{formatCurrency(l.product.price * l.quantity)}</div>
                  </div>
                ))}
              </div>
              <div style={styles.cartFooter}>
                <div style={styles.totalRow}>
                  <span>{t('vendor.posPage.total')}</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <button style={{ ...styles.payBtn, ...(total <= 0 ? styles.payBtnDisabled : {}) }} disabled={total <= 0} onClick={openPay}>
                  {t('vendor.posPage.charge')} {total > 0 ? formatCurrency(total) : ''}
                </button>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <AiAssistant
              module="pos"
              feature="assistant"
              features={['assistant', 'analyze', 'summarize', 'recommend']}
              context={posContext}
              title="AI · POS"
              description={shift ? `Shift ${shift.shiftNumber} — ${cartList.length} items — grounded in cart and shift.` : 'No active shift — AI sees POS state.'}
              placeholder="e.g. Is this cart low on stock? Summarize shift…"
              suggestedPrompts={['Analyze cart for stock risk', 'Summarize current shift', 'Recommend next restock', 'Is there a pricing anomaly?']}
            />
          </div>
        </>
      )}

      {payOpen && (
        <div style={styles.overlay} onClick={() => !saving && setPayOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{t('vendor.posPage.takePayment')}</div>
            <div style={styles.bigTotal}>
              <span>{t('vendor.posPage.totalDue')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t('vendor.posPage.paymentMethod')}</label>
              <select style={styles.input} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PosPaymentMethod)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            {paymentMethod === 'cash' && (
              <div style={styles.field}>
                <label style={styles.label}>{t('vendor.posPage.amountTendered')}</label>
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
                {saving ? t('vendor.posPage.processing') : t('vendor.posPage.completeSale')}
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div style={styles.overlay}>
          <div style={styles.receipt} id="receipt-print">
            <div style={styles.receiptMsg}>{t('vendor.posPage.saleComplete')}{receipt.sale.saleNumber}</div>
            {receipt.shiftNumber && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Shift: {receipt.shiftNumber}</div>}
            <pre style={styles.receiptPre}>{receipt.receiptText}</pre>
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={doneReceipt}>{t('vendor.posPage.done')}</button>
              <button style={styles.saveBtn} onClick={() => window.print()}>{t('vendor.posPage.print')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {shiftModal === 'open' && (
        <div style={styles.overlay} onClick={() => !shiftSaving && setShiftModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{t('vendor.posPage.openShift')}</div>
            <div style={styles.field}>
              <label style={styles.label}>{t('vendor.posPage.openingFloat')}</label>
              <input style={styles.input} type="number" min={0} value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} placeholder={t('vendor.posPage.cashInDrawer')} />
            </div>
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setShiftModal(null)} disabled={shiftSaving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(shiftSaving ? { opacity: 0.6 } : {}) }} onClick={openShift} disabled={shiftSaving}>
                {shiftSaving ? t('vendor.posPage.opening') : t('vendor.posPage.openShift')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {shiftModal === 'close' && shift && (
        <div style={styles.overlay} onClick={() => !shiftSaving && setShiftModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{t('vendor.posPage.closeShiftTitle')} {shift.shiftNumber}</div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.6rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
              <div>Sales: {shift.salesCount} â€” Total: {shift.totalSales.toLocaleString()}</div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t('vendor.posPage.closingCash')}</label>
              <input style={styles.input} type="number" min={0} value={closingCash} onChange={(e) => setClosingCash(e.target.value)} placeholder={t('vendor.posPage.countCashInDrawer')} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t('vendor.posPage.notesOptional')}</label>
              <textarea style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} value={shiftNotes} onChange={(e) => setShiftNotes(e.target.value)} placeholder={t('vendor.posPage.shiftNotesPlaceholder')} />
            </div>
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setShiftModal(null)} disabled={shiftSaving}>Cancel</button>
              <button style={{ ...styles.saveBtn, background: '#dc2626', ...(shiftSaving ? { opacity: 0.6 } : {}) }} onClick={closeShift} disabled={shiftSaving || !closingCash.trim()}>
                {shiftSaving ? t('vendor.posPage.closing') : t('vendor.posPage.closeShift')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}