import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import AiAssistant from '../../components/AiAssistant';
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
  const { t } = useTranslation();
  const s = 'vendor.suppliersPage.';
  const { data: raw, loading, error, refetch } = useApi<Supplier[]>('/vendor/suppliers');
  const suppliers: Supplier[] = Array.isArray(raw) ? raw : [];
  const suppliersContext = useMemo(() => {
    const facts: Record<string, unknown> = { totalSuppliers: suppliers.length, activeSuppliers: suppliers.filter((s) => s.status === 'ACTIVE').length };
    const rows = suppliers.slice(0, 20).map((s) => ({ kind: 'supplier', name: s.name, phone: s.phone, contactPerson: s.contactPerson, status: s.status }));
    return { summary: `Suppliers — ${suppliers.length} suppliers`, facts, rows, constraints: ['Ground in supplier rows.'] };
  }, [suppliers]);
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
      setFormError(t(s + 'nameRequired'));
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
      setFormError(err.response?.data?.message || err.message || t(s + 'failedSave'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (supplier: Supplier) => {
    if (!window.confirm(`${t(s + 'deactivateConfirmPrefix')}"${supplier.name}"?`)) return;
    setActionError(null);
    setBusyId(supplier.id);
    try {
      await api.delete(`/vendor/suppliers/${supplier.id}`);
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || t(s + 'failedDeactivate'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={styles.container}>
      {actionError && <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>{actionError}</div>}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>{t(s + 'title')}</h1>
          <div style={styles.subtitle}>{t(s + 'subtitle')}</div>
        </div>
        <button style={styles.addButton} onClick={openCreate}>{t(s + 'addSupplier')}</button>
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
                <th style={styles.th}>{t(s + 'name')}</th>
                <th style={styles.th}>{t(s + 'contact')}</th>
                <th style={styles.th}>{t(s + 'phone')}</th>
                <th style={styles.th}>{t(s + 'status')}</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && (
                <tr>
                  <td style={styles.empty} colSpan={5}>{t(s + 'noSuppliers')}</td>
                </tr>
              )}
              {suppliers.map((sup) => (
                <tr key={sup.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 700 }}>{sup.name}</div>
                    {sup.notes && <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{sup.notes}</div>}
                  </td>
                  <td style={styles.td}>{sup.contactPerson || '—'}</td>
                  <td style={styles.td}>{sup.phone || '—'}</td>
                  <td style={styles.td}><StatusBadge status={sup.status} /></td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    {sup.status === 'ACTIVE' && (
                      <>
                        <button style={{ ...styles.deleteBtn, marginRight: '0.5rem', borderColor: '#93c5fd', color: '#2563eb' }} disabled={busyId === sup.id} onClick={() => openEdit(sup)}>
                          {t(s + 'edit')}
                        </button>
                        <button style={styles.deleteBtn} disabled={busyId === sup.id} onClick={() => remove(sup)}>
                          {busyId === sup.id ? '…' : t(s + 'deactivate')}
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
            <div style={styles.modalTitle}>{editId ? t(s + 'editSupplier') : t(s + 'addSupplierTitle')}</div>
            <div style={styles.field}>
              <label style={styles.label}>{t(s + 'nameLabel')}</label>
              <input style={styles.input} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t(s + 'namePlaceholder')} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(s + 'phoneLabel')}</label>
              <input style={styles.input} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder={t(s + 'phonePlaceholder')} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(s + 'contactPerson')}</label>
              <input style={styles.input} value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(s + 'notes')}</label>
              <textarea style={styles.textarea} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setOpen(false)} disabled={saving}>{t(s + 'cancel')}</button>
              <button style={{ ...styles.saveBtn, ...(saving ? { opacity: 0.6 } : {}) }} onClick={submit} disabled={saving}>
                {saving ? t(s + 'saving') : t(s + 'saveSupplier')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <AiAssistant
          module="suppliers"
          feature="analyze"
          features={['assistant', 'analyze', 'summarize', 'recommend']}
          context={suppliersContext}
          title="AI · Suppliers"
          description={`Ask about your ${suppliers.length} suppliers — AI sees the same list.`}
          placeholder="e.g. Which suppliers need follow-up? Summarize my supplier base…"
          suggestedPrompts={['Analyze my suppliers — who is most critical?', 'Summarize suppliers by status', 'Recommend supplier cleanup actions']}
        />
      </div>
    </div>
  );
}
