import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Product, PaginatedResponse } from '../../types';

interface NewProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  type: string;
  categoryId: string;
  unit: string;
}

const PRODUCT_TYPES = ['food', 'grocery', 'secondhand', 'general', 'laundry', 'service', 'tailoring', 'cargo'];

const PRODUCT_UNITS = ['pcs', 'kg', 'bundle', 'hour', 'day', 'person', 'set', 'meter'];

const CATEGORIES: Record<string, { id: string; label: string }[]> = {
  food: [
    { id: 'd0000000-0000-0000-0000-000000000012', label: 'Chakula Kilicho Tayari' },
    { id: 'd0000000-0000-0000-0000-000000000040', label: 'Wali na Nyama Choma' },
    { id: 'd0000000-0000-0000-0000-000000000041', label: 'Ugali na Samaki' },
    { id: 'd0000000-0000-0000-0000-000000000042', label: 'Mihogo na Kuku' },
    { id: 'd0000000-0000-0000-0000-000000000043', label: 'Chipsi na Maji' },
    { id: 'd0000000-0000-0000-0000-000000000044', label: 'Supu na Mboga' },
    { id: 'd0000000-0000-0000-0000-000000000045', label: 'Pilau na Biryani' },
    { id: 'd0000000-0000-0000-0000-000000000017', label: 'Kupikiwa Nyumbani (Wapishi)' },
  ],
  grocery: [
    { id: 'd0000000-0000-0000-0000-000000000013', label: 'Mboga na Matunda' },
    { id: 'd0000000-0000-0000-0000-000000000050', label: 'Mboga' },
    { id: 'd0000000-0000-0000-0000-000000000051', label: 'Matunda' },
    { id: 'd0000000-0000-0000-0000-000000000052', label: 'Mchele na Maharage' },
    { id: 'd0000000-0000-0000-0000-000000000053', label: 'Hoho na Karoti' },
    { id: 'd0000000-0000-0000-0000-000000000054', label: 'Vitunguu na Mboga Kavu' },
    { id: 'd0000000-0000-0000-0000-000000000055', label: 'Nyama na Samaki Fresh' },
    { id: 'd0000000-0000-0000-0000-000000000056', label: 'Milk na Dairy Products' },
  ],
  electronics: [
    { id: 'd0000000-0000-0000-0000-000000000080', label: 'Electronics' },
    { id: 'd0000000-0000-0000-0000-000000000085', label: 'Mitandao na Simu' },
  ],
  general: [
    { id: 'd0000000-0000-0000-0000-000000000081', label: 'Vifaa vya Nyumbani' },
    { id: 'd0000000-0000-0000-0000-000000000082', label: 'Fanicha' },
    { id: 'd0000000-0000-0000-0000-000000000083', label: 'Vyombo vya Usafiri' },
    { id: 'd0000000-0000-0000-0000-000000000084', label: 'Vifaa vya Ujenzi (Hardware)' },
    { id: 'd0000000-0000-0000-0000-000000000086', label: 'Vifaa vya Michezo' },
    { id: 'd0000000-0000-0000-0000-000000000087', label: 'Vitabu na Vifaa vya Masomo' },
  ],
  secondhand: [
    { id: 'd0000000-0000-0000-0000-000000000018', label: 'Vitu vya Used' },
    { id: 'd0000000-0000-0000-0000-000000000022', label: 'Nguo za Used' },
    { id: 'd0000000-0000-0000-0000-000000000023', label: 'Electronics za Used' },
    { id: 'd0000000-0000-0000-0000-000000000024', label: 'Mitambo na Machine' },
    { id: 'd0000000-0000-0000-0000-000000000025', label: 'Tools na Zana' },
    { id: 'd0000000-0000-0000-0000-000000000026', label: 'Fanicha za Used' },
  ],
  laundry: [
    { id: 'd0000000-0000-0000-0000-000000000015', label: 'Ufuaji na Usafishaji Nguo' },
    { id: 'd0000000-0000-0000-0000-000000000060', label: 'Mama Fua' },
    { id: 'd0000000-0000-0000-0000-000000000061', label: 'Kufuliwa Nyumbani' },
  ],
  service: [
    { id: 'd0000000-0000-0000-0000-000000000016', label: 'Usafi Nyumbani na Bustani' },
  ],
  tailoring: [
    { id: 'd0000000-0000-0000-0000-000000000021', label: 'Ushonaji na Tailoring' },
    { id: 'd0000000-0000-0000-0000-000000000070', label: 'Nguo za Kiume' },
    { id: 'd0000000-0000-0000-0000-000000000071', label: 'Nguo za Kike' },
    { id: 'd0000000-0000-0000-0000-000000000072', label: 'Vazi la Harusi' },
    { id: 'd0000000-0000-0000-0000-000000000073', label: 'Uniforms na Workwear' },
  ],
  cargo: [
    { id: 'd0000000-0000-0000-0000-000000000090', label: 'Cargo ya Ndani' },
    { id: 'd0000000-0000-0000-0000-000000000091', label: 'Express Delivery' },
    { id: 'd0000000-0000-0000-0000-000000000092', label: 'Logistics ya Biashara' },
    { id: 'd0000000-0000-0000-0000-000000000093', label: 'Kukodisha Lori/Cherehe' },
  ],
};

const emptyForm: NewProduct = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  type: '',
  categoryId: '',
  unit: 'pcs',
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  addButton: {
    background: '#1e40af',
    color: '#fff',
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  empty: { textAlign: 'center', color: '#64748b', padding: '2rem' },
  actionBtn: {
    padding: '0.35rem 0.7rem',
    fontSize: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    marginRight: '0.4rem',
    color: '#334155',
  },
  deleteBtn: { color: '#dc2626', borderColor: '#fecaca' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '420px', maxWidth: '90vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', minHeight: '70px', boxSizing: 'border-box', fontFamily: 'inherit' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#334155' },
  saveBtn: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  saveBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  smallError: { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' },
};


export default function VendorProducts() {
  const { formatCurrency } = useCurrency();
  const { data: raw, loading, error, refetch } = useApi<PaginatedResponse<Product> | Product[]>('/vendors/me/products');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewProduct>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const products: Product[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  const openModal = () => {
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const updateField = (field: keyof NewProduct, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitProduct = async () => {
    if (!form.name.trim() || !form.type || !form.categoryId || form.price <= 0) {
      setFormError('Name, type, category, and a positive price are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/products', {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stockQuantity: Number(form.stock),
        type: form.type,
        categoryId: form.categoryId,
        unit: form.unit,
      });
      setModalOpen(false);
      await refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    alert(`Edit product "${product.name}" (stub)`);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      await refetch();
    } catch {
      alert('Failed to delete product.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Products</h1>
        <button style={styles.addButton} onClick={openModal}>+ Add Product</button>
      </div>

      <div style={styles.card}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ padding: '1rem' }}><ErrorMessage message={error} /></div>
        ) : products.length === 0 ? (
          <div style={styles.empty}>No products yet. Click "Add Product" to create one.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={styles.td}>{product.name}</td>
                  <td style={styles.td}>{formatCurrency(product.price)}</td>
                  <td style={styles.td}>{product.stockQuantity} {product.unit}</td>
                  <td style={styles.td}><StatusBadge status={product.status} /></td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button style={styles.actionBtn} onClick={() => handleEdit(product)}>Edit</button>
                    <button style={{ ...styles.actionBtn, ...styles.deleteBtn }} onClick={() => handleDelete(product)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div style={styles.overlay} onClick={() => !saving && setModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Add Product</div>
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input style={styles.input} value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea style={styles.textarea} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Price</label>
              <input type="number" min={0} step="0.01" style={styles.input} value={form.price} onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Stock</label>
              <input type="number" min={0} style={styles.input} value={form.stock} onChange={(e) => updateField('stock', parseInt(e.target.value, 10) || 0)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Unit</label>
              <select
                style={styles.input}
                value={form.unit}
                onChange={(e) => updateField('unit', e.target.value)}
              >
                {PRODUCT_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Type</label>
              <select
                style={styles.input}
                value={form.type}
                onChange={(e) => {
                  updateField('type', e.target.value);
                  updateField('categoryId', '');
                }}
              >
                <option value="">Select type…</option>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.input}
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
              >
                <option value="">Select category…</option>
                {(CATEGORIES[form.type] || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={submitProduct} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}