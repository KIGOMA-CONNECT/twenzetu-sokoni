import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Supplier } from '../../types';

interface SupplierForm {
  name: string;
  phone: string;
  contactPerson: string;
  notes: string;
}

const emptyForm: SupplierForm = { name: '', phone: '', contactPerson: '', notes: '' };

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.15rem' },
  addButton: { background: '#1e40af', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', background: 'var(--bg)', color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--line)' },
  td: { padding: '0.7rem 1rem', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', verticalAlign: 'top' },
  empty: { padding: '2.5rem', textAlign: 'center', color: 'var(--faint)' },
  deleteBtn: { background: 'none', border: '1px solid #fecaca', color: 'var(--danger)', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '440px', maxWidth: '92vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '64px', resize: 'vertical' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' },
  saveBtn: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 },
  smallError: { color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' },
};

export default function VendorSuppliers() {
  const { data: raw, loading, error, refetch } = useApi<Supplier[]>('/vendor/suppliers');
  const suppliers: Supplier[] = Array.isArray(raw) ? raw : [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const update = (field: keyof SupplierForm, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setForm({
      name: supplier.name,
      phone: supplier.phone || '',
      contactPerson: supplier.contactPerson || '',
      notes: supplier.notes || '',
    });
    setEditId(supplier.id);
    setFormError(null);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      setFormError('Supplier name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        contactPerson: form.contactPerson.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editId) {
        await api.patch(`/vendor/suppliers/${editId}`, payload);
      } else {
        await api.post('/vendor/suppliers', payload);
      }
      setOpen(false);
      setEditId(null);
      await refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save supplier.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (supplier: Supplier) => {
    if (!window.confirm(`Deactivate supplier "${supplier.name}"?`)) return;
    setActionError(null);
    setBusyId(supplier.id);
    try {
      await api.delete(`/vendor/suppliers/${supplier.id}`);
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to deactivate supplier.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={styles.container}>
      {actionError && <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>{actionError}</div>}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Suppliers</h1>
          <div style={styles.subtitle}>Your vendor supplier registry</div>
        </div>
        <button style={styles.addButton} onClick={openCreate}>+ Add Supplier</button>
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
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && (
                <tr>
                  <td style={styles.empty} colSpan={5}>No suppliers yet. Add your first supplier.</td>
                </tr>
              )}
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 700 }}>{s.name}</div>
                    {s.notes && <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{s.notes}</div>}
                  </td>
                  <td style={styles.td}>{s.contactPerson || 'â€”'}</td>
                  <td style={styles.td}>{s.phone || 'â€”'}</td>
                  <td style={styles.td}><StatusBadge status={s.status} /></td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    {s.status === 'ACTIVE' && (
                      <>
                        <button style={{ ...styles.deleteBtn, marginRight: '0.5rem', borderColor: '#93c5fd', color: '#2563eb' }} disabled={busyId === s.id} onClick={() => openEdit(s)}>
                          Edit
                        </button>
                        <button style={styles.deleteBtn} disabled={busyId === s.id} onClick={() => remove(s)}>
                          {busyId === s.id ? 'â€¦' : 'Deactivate'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div style={styles.overlay} onClick={() => !saving && setOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{editId ? 'Edit Supplier' : 'Add Supplier'}</div>
            <div style={styles.field}>
              <label style={styles.label}>Name *</label>
              <input style={styles.input} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Central Millers" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Phone</label>
              <input style={styles.input} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="e.g. +2557xxxxxxxx" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Contact Person</label>
              <input style={styles.input} value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Notes</label>
              <textarea style={styles.textarea} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving ? { opacity: 0.6 } : {}) }} onClick={submit} disabled={saving}>
                {saving ? 'Savingâ€¦' : 'Save Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}