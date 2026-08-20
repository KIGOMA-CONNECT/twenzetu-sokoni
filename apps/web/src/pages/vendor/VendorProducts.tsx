import { useRef, useState } from 'react';
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
  sku: string;
  barcode: string;
  imageUrl: string;
  status: string;
}

interface BulkResult {
  created: Array<{ productId: string; name: string }>;
  failed: Array<{ index: number; name: string; error: string }>;
}

interface BulkRow {
  name: string;
  description?: string;
  price: number;
  type: string;
  categoryId: string;
  imageUrl?: string;
  stockQuantity?: number;
  unit?: string;
  sku?: string;
  barcode?: string;
}

const PRODUCT_TYPES = ['food', 'grocery', 'secondhand', 'general', 'laundry', 'service'];

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
};

const CATEGORY_BY_LABEL: Record<string, string> = {};
Object.values(CATEGORIES).forEach((list) =>
  list.forEach((c) => {
    CATEGORY_BY_LABEL[c.label.toLowerCase()] = c.id;
    CATEGORY_BY_LABEL[c.id] = c.id;
  }),
);

const emptyForm: NewProduct = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  type: '',
  categoryId: '',
  unit: 'pcs',
  sku: '',
  barcode: '',
  imageUrl: '',
  status: 'ACTIVE',
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  headerActions: { display: 'flex', gap: '0.6rem' },
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
  bulkButton: {
    background: '#fff',
    color: '#1e40af',
    border: '1px solid #1e40af',
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
  th: { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--ink-soft)', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  thumb: { width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'var(--bg)' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '2rem' },
  actionBtn: {
    padding: '0.35rem 0.7rem',
    fontSize: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    marginRight: '0.4rem',
    color: 'var(--text)',
  },
  deleteBtn: { color: 'var(--danger)', borderColor: '#fecaca' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '460px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', minHeight: '70px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' },
  saveBtn: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  saveBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  smallError: { color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' },
  smallSuccess: { color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.5rem' },
  preview: { marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' },
  previewImg: { width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' },
  linkBtn: { background: 'none', border: 'none', color: '#1e40af', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', padding: 0 },
  bulkBody: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  resultBox: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.8rem', maxHeight: '200px', overflowY: 'auto', fontSize: '0.8rem' },
};

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; } else inQuotes = false;
      } else current += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCsvRows(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return row;
  });
}

function resolveCategoryId(raw: string): string {
  if (!raw) return '';
  if (CATEGORY_BY_LABEL[raw.toLowerCase()]) return CATEGORY_BY_LABEL[raw.toLowerCase()];
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) return raw;
  return '';
}

function normalizeBulkInput(parsed: any[]): { items: BulkRow[]; errors: string[] } {
  const items: BulkRow[] = [];
  const errors: string[] = [];
  parsed.forEach((raw, idx) => {
    const name = String(raw.name ?? '').trim();
    const type = String(raw.type ?? '').trim().toLowerCase();
    const price = Number(raw.price);
    const categoryRaw = String(raw.categoryId ?? raw.category ?? '').trim();
    const categoryId = resolveCategoryId(categoryRaw);
    if (!name) { errors.push(`Row ${idx + 1}: name is required`); return; }
    if (!PRODUCT_TYPES.includes(type)) { errors.push(`Row ${idx + 1} (${name}): unsupported type "${type || '(empty)'}"`); return; }
    if (isNaN(price) || price < 0) { errors.push(`Row ${idx + 1} (${name}): invalid price`); return; }
    if (!categoryId) { errors.push(`Row ${idx + 1} (${name}): unknown category "${categoryRaw}"`); return; }
    items.push({
      name,
      description: raw.description ? String(raw.description) : undefined,
      price,
      type,
      categoryId,
      imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
      stockQuantity: raw.stockQuantity !== undefined ? Number(raw.stockQuantity) : undefined,
      unit: raw.unit ? String(raw.unit) : undefined,
      sku: raw.sku ? String(raw.sku) : undefined,
      barcode: raw.barcode ? String(raw.barcode) : undefined,
    });
  });
  return { items, errors };
}

function downloadTemplate() {
  const csv = [
    'name,price,type,category,stock,unit,sku,barcode,description,imageUrl',
    '"Mchele 1kg",4500,general,"Mchele na Maharage",50,pcs,MCHE-001,1234567890123,"Mchele mzuri",',
    '"Sukuma Wiki",500,grocery,"Mboga",30,bundle,SKM-002,,"Kikundi kimoja",',
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function VendorProducts() {
  const { formatCurrency } = useCurrency();
  const { data: raw, loading, error, refetch } = useApi<PaginatedResponse<Product> | Product[]>('/vendors/me/products');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<NewProduct>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const products: Product[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  const openModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      stock: product.stockQuantity ?? 0,
      type: product.type,
      categoryId: product.categoryId ?? '',
      unit: product.unit ?? 'pcs',
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      imageUrl: product.imageUrl ?? '',
      status: product.status ?? 'ACTIVE',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const updateField = (field: keyof NewProduct, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const uploadImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/uploads/product-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        updateField('imageUrl', String(url));
      } else {
        setFormError('Upload succeeded but no URL was returned.');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submitProduct = async () => {
    if (!form.name.trim() || !form.type || !form.categoryId || form.price <= 0) {
      setFormError('Name, type, category, and a positive price are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stockQuantity: Number(form.stock),
      type: form.type,
      categoryId: form.categoryId,
      imageUrl: form.imageUrl.trim() || undefined,
      unit: form.unit,
      sku: form.sku.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
    };
    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, {
          ...payload,
          status: form.status,
        });
      } else {
        await api.post('/products', payload);
      }
      setModalOpen(false);
      await refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    const next = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/products/${product.id}`, { status: next });
      await refetch();
    } catch {
      alert('Failed to update product status.');
    }
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

  const handleBulkFile = (file: File | undefined) => {
    if (!file) return;
    setBulkFileName(file.name);
    setBulkError(null);
    const reader = new FileReader();
    reader.onload = () => setBulkText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const parseBulkInput = (): { items: BulkRow[]; errors: string[] } => {
    const text = bulkText.trim();
    if (!text) return { items: [], errors: ['Paste CSV/JSON or choose a file.'] };
    let parsed: any[];
    if (text.startsWith('[')) {
      try {
        parsed = JSON.parse(text);
      } catch {
        return { items: [], errors: ['Invalid JSON.'] };
      }
    } else {
      parsed = parseCsvRows(text);
    }
    return normalizeBulkInput(parsed);
  };

  const submitBulk = async () => {
    const { items, errors } = parseBulkInput();
    if (errors.length > 0) {
      setBulkError(errors.join('\n'));
      setBulkResult(null);
      return;
    }
    if (items.length === 0) {
      setBulkError('No valid rows to import.');
      setBulkResult(null);
      return;
    }
    setBulkBusy(true);
    setBulkError(null);
    try {
      const res = await api.post('/products/bulk', { products: items });
      setBulkResult(res.data?.data ?? res.data ?? { created: [], failed: [] });
      setBulkText('');
      setBulkFileName('');
      await refetch();
    } catch (err: any) {
      setBulkError(err.response?.data?.message || err.message || 'Bulk import failed.');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Products (Duka)</h1>
        <div style={styles.headerActions}>
          <button style={styles.bulkButton} onClick={() => { setBulkOpen(true); setBulkResult(null); setBulkError(null); setBulkText(''); setBulkFileName(''); }}>
            Upload Bulk
          </button>
          <button style={styles.addButton} onClick={openModal}>+ Add Product</button>
        </div>
      </div>

      <div style={styles.card}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ padding: '1rem' }}><ErrorMessage message={error} /></div>
        ) : products.length === 0 ? (
          <div style={styles.empty}>No products yet. Click "Add Product" or "Upload Bulk" to get started.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}></th>
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
                  <td style={styles.td}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} style={styles.thumb} />
                    ) : (
                      <div style={{ ...styles.thumb, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--line)', fontSize: '1.1rem' }}>🖼️</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    {product.sku && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>SKU: {product.sku}</div>}
                  </td>
                  <td style={styles.td}>{formatCurrency(product.price)}</td>
                  <td style={styles.td}>{product.stockQuantity} {product.unit}</td>
                  <td style={styles.td}><StatusBadge status={product.status} /></td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button style={styles.actionBtn} onClick={() => openEdit(product)}>Edit</button>
                    <button style={styles.actionBtn} onClick={() => toggleStatus(product)}>
                      {product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
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
            <div style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</div>
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input style={styles.input} value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea style={styles.textarea} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Price (TZS)</label>
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
              <label style={styles.label}>SKU (for POS scanning)</label>
              <input style={styles.input} value={form.sku} placeholder="e.g. RK-001" onChange={(e) => updateField('sku', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Barcode</label>
              <input style={styles.input} value={form.barcode} placeholder="e.g. 8964000001234" onChange={(e) => updateField('barcode', e.target.value)} />
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
            <div style={styles.field}>
              <label style={styles.label}>Product Photo</label>
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                style={{ fontSize: '0.8rem' }}
                onChange={(e) => uploadImage(e.target.files?.[0])}
              />
              {uploading && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Uploading…</div>}
              {form.imageUrl && (
                <div style={styles.preview}>
                  <img src={form.imageUrl} alt="Product preview" style={styles.previewImg} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', wordBreak: 'break-all', flex: 1 }}>{form.imageUrl}</span>
                  <button
                    style={styles.linkBtn}
                    onClick={() => updateField('imageUrl', '')}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {editingProduct && (
              <div style={styles.field}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.input}
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="OUT_OF_STOCK">Out of stock</option>
                </select>
              </div>
            )}
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setModalOpen(false)} disabled={saving || uploading}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving || uploading ? styles.saveBtnDisabled : {}) }} onClick={submitProduct} disabled={saving || uploading}>
                {saving ? 'Saving…' : editingProduct ? 'Save Changes' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div style={styles.overlay} onClick={() => !bulkBusy && setBulkOpen(false)}>
          <div style={{ ...styles.modal, width: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Bulk Upload Products</div>
            <div style={styles.bulkBody}>
              <div>
                <button style={styles.linkBtn} onClick={downloadTemplate}>Download CSV template</button>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {' '}— columns: name, price, type, category, stock, unit, sku, barcode, description, imageUrl
                </span>
              </div>
              <div>
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  ref={bulkFileRef}
                  style={{ fontSize: '0.8rem' }}
                  onChange={(e) => handleBulkFile(e.target.files?.[0])}
                />
                {bulkFileName && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>File: {bulkFileName}</div>}
              </div>
              <div>
                <label style={styles.label}>Or paste CSV / JSON below</label>
                <textarea
                  style={{ ...styles.textarea, minHeight: '150px', fontFamily: 'monospace' }}
                  value={bulkText}
                  placeholder={'Mchele 1kg,4500,general,"Mchele na Maharage",50,pcs,MCHE-001,,,\nSukuma Wiki,500,grocery,Mboga,30,bundle,SKM-002,,,'}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>
              {bulkError && (
                <div style={styles.resultBox}>
                  <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '0.4rem' }}>Fix these rows:</div>
                  {bulkError.split('\n').map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
              {bulkResult && (
                <div style={styles.resultBox}>
                  <div style={{ color: 'var(--success)', fontWeight: 600 }}>✅ {bulkResult.created.length} product(s) created</div>
                  {bulkResult.failed.length > 0 && (
                    <div style={{ color: 'var(--danger)', fontWeight: 600, marginTop: '0.4rem' }}>{bulkResult.failed.length} failed:</div>
                  )}
                  {bulkResult.failed.map((f, i) => (
                    <div key={i} style={{ color: 'var(--danger)' }}>• {f.name}: {f.error}</div>
                  ))}
                </div>
              )}
              <div style={styles.footer}>
                <button style={styles.cancelBtn} onClick={() => setBulkOpen(false)} disabled={bulkBusy}>Close</button>
                <button style={{ ...styles.saveBtn, ...(bulkBusy ? styles.saveBtnDisabled : {}) }} onClick={submitBulk} disabled={bulkBusy}>
                  {bulkBusy ? 'Importing…' : 'Import Products'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
