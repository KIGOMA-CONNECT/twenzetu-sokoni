import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Product, PurchaseOrder, Supplier } from '../../types';

interface DraftLine {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}



const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.15rem' },
  addButton: { background: '#1e40af', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', background: 'var(--bg)', color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--line)' },
  td: { padding: '0.7rem 1rem', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', verticalAlign: 'top' },
  empty: { padding: '2.5rem', textAlign: 'center', color: 'var(--faint)' },
  actionBtn: { background: 'none', border: '1px solid #cbd5e1', color: 'var(--text)', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, margin: '0.15rem' },
  actionPrimary: { background: '#1e40af', borderColor: '#1e40af', color: '#fff' },
  actionGreen: { background: 'var(--success)', borderColor: 'var(--success)', color: '#fff' },
  actionRed: { background: 'none', borderColor: '#fecaca', color: 'var(--danger)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '640px', maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  lineRow: { display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.9fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' },
  lineTotal: { fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)' },
  removeBtn: { background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' },
  saveBtn: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 },
  smallError: { color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' },
  totals: { fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink)' },
};

export default function VendorPurchaseOrders() {
  const { formatCurrency } = useCurrency();
  const { data: raw, loading, error, refetch } = useApi<PurchaseOrder[]>('/vendor/purchase-orders');
  const orders: PurchaseOrder[] = Array.isArray(raw) ? raw : [];
  const { data: rawSuppliers } = useApi<Supplier[]>('/vendor/suppliers');
  const suppliers: Supplier[] = Array.isArray(rawSuppliers) ? rawSuppliers : [];
  const { data: rawProducts } = useApi<Product[]>('/pos/products');
  const products: Product[] = Array.isArray(rawProducts) ? rawProducts : [];

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const draftTotal = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
  const itemCount = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'ORDERED').length;

  const openCreate = () => {
    setSupplierId(suppliers[0]?.id ?? '');
    setNotes('');
    setLines([{ productId: products[0]?.id ?? '', productName: products[0]?.name ?? '', quantity: 1, unitCost: products[0]?.price ?? 0 }]);
    setFormError(null);
    setOpen(true);
  };

  const addLine = () => {
    setLines((prev) => [...prev, { productId: '', productName: '', quantity: 1, unitCost: 0 }]);
  };

  const setLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, i) => {
      if (i !== index) return l;
      const next = { ...l, ...patch };
      if (patch.productId !== undefined && patch.productId !== l.productId) {
        const p = products.find((pr) => pr.id === patch.productId);
        next.productName = p?.name ?? '';
        if (p && !l.productId) {
          next.unitCost = p.price;
        }
      }
      return next;
    }));
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const validLines = lines.filter((l) => l.productId && l.quantity > 0 && l.unitCost >= 0);
    if (validLines.length === 0) {
      setFormError('Add at least one product with a quantity.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/vendor/purchase-orders', {
        supplierId: supplierId || undefined,
        notes: notes.trim() || undefined,
        items: validLines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
      });
      setOpen(false);
      await refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (order: PurchaseOrder, path: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionError(null);
    setBusyId(order.id);
    try {
      await api.post(`/vendor/purchase-orders/${order.id}/${path}`);
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const togglePaid = async (order: PurchaseOrder) => {
    setActionError(null);
    setBusyId(order.id);
    try {
      await api.post(`/vendor/purchase-orders/${order.id}/payment`, { paid: order.paymentStatus !== 'PAID' });
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update payment.');
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (order: PurchaseOrder) => {
    const busy = busyId === order.id;
    const btn = (path: string, label: string, style: React.CSSProperties, confirmMsg?: string) => (
      <button style={style} disabled={busy} onClick={() => runAction(order, path, confirmMsg)}>
        {busy ? 'â€¦' : label}
      </button>
    );
    if (order.status === 'ORDERED') {
      return (
        <>
          {btn('receive', 'Receive', styles.actionGreen)}
          {btn('cancel', 'Cancel', styles.actionRed, `Cancel ${order.poNumber}?`)}
        </>
      );
    }
    if (order.status === 'RECEIVED') return btn('confirm', 'Confirm', styles.actionPrimary);
    if (order.status === 'CONFIRMED') return btn('complete', 'Complete', styles.actionGreen);
    return null;
  };

  return (
    <div style={styles.container}>
      {actionError && <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>{actionError}</div>}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Purchase Orders</h1>
          <div style={styles.subtitle}>
            {orders.length} orders Â· {itemCount} units ordered Â· {pendingCount} awaiting receipt
          </div>
        </div>
        <button style={styles.addButton} onClick={openCreate}>+ New Purchase Order</button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>PO Number</th>
                <th style={styles.th}>Supplier</th>
                <th style={styles.th}>Items</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Payment</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td style={styles.empty} colSpan={7}>No purchase orders yet.</td>
                </tr>
              )}
              {orders.map((o) => {
                const supplier = suppliers.find((s) => s.id === o.supplierId);
                return (
                  <tr key={o.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 700 }}>{o.poNumber}</div>
                      <div style={{ color: 'var(--faint)', fontSize: '0.75rem' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={styles.td}>{supplier?.name || 'â€”'}</td>
                    <td style={styles.td}>
                      {o.items.length} line{o.items.length === 1 ? '' : 's'}
                      <div style={{ color: 'var(--faint)', fontSize: '0.75rem' }}>
                        {o.items.slice(0, 2).map((i) => i.productName).join(', ')}{o.items.length > 2 ? 'â€¦' : ''}
                      </div>
                    </td>
                    <td style={styles.td}><span style={{ fontWeight: 700 }}>{formatCurrency(o.subtotal)}</span> {o.currency}</td>
                    <td style={styles.td}><StatusBadge status={o.status} /></td>
                    <td style={styles.td}>
                      {o.status === 'CANCELLED' ? (
                        <StatusBadge status={o.paymentStatus} />
                      ) : (
                        <button style={{ ...styles.actionBtn, ...(o.paymentStatus === 'PAID' ? styles.actionGreen : {}) }} onClick={() => togglePaid(o)}>
                          {o.paymentStatus === 'PAID' ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>{renderActions(o)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div style={styles.overlay} onClick={() => !saving && setOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>New Purchase Order</div>
            <div style={styles.field}>
              <label style={styles.label}>Supplier</label>
              <select style={styles.input} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">No supplier (general purchase)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Items</label>
              {lines.map((l, i) => (
                <div key={i} style={styles.lineRow}>
                  <select
                    style={styles.input}
                    value={l.productId}
                    onChange={(e) => setLine(i, { productId: e.target.value })}
                  >
                    <option value="">Select productâ€¦</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (stock {p.stockQuantity})</option>
                    ))}
                  </select>
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => setLine(i, { quantity: Math.max(1, Number(e.target.value)) })}
                  />
                  <input
                    style={styles.input}
                    type="number"
                    min={0}
                    value={l.unitCost}
                    onChange={(e) => setLine(i, { unitCost: Math.max(0, Number(e.target.value)) })}
                  />
                  <button style={styles.removeBtn} onClick={() => removeLine(i)} title="Remove line">âœ•</button>
                </div>
              ))}
              <button style={{ ...styles.actionBtn, marginTop: '0.25rem' }} onClick={addLine}>+ Add Line</button>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Notes</label>
              <input style={styles.input} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div style={styles.totals}>Total: {formatCurrency(draftTotal)}</div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving ? { opacity: 0.6 } : {}) }} onClick={submit} disabled={saving}>
                {saving ? 'Creatingâ€¦' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}