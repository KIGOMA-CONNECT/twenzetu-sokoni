import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { Address } from '../../types';

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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' },
  addressCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  label: { fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' },
  fullAddress: { fontSize: '0.875rem', color: '#334155', marginBottom: '0.75rem' },
  deleteBtn: {
    background: '#fff',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '0.35rem 0.7rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: { textAlign: 'center', color: '#64748b', padding: '3rem', gridColumn: '1 / -1' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '420px', maxWidth: '90vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  fieldLabel: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#334155' },
  saveBtn: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  saveBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  smallError: { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' },
};

interface AddressForm {
  label: string;
  fullAddress: string;
}

const emptyForm: AddressForm = { label: '', fullAddress: '' };

export default function AddressPage() {
  const { data: addresses, loading, error, refetch } = useApi<Address[]>('/addresses/me');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openModal = () => {
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const updateField = (field: keyof AddressForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitAddress = async () => {
    if (!form.label.trim() || !form.fullAddress.trim()) {
      setFormError('Label and full address are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/addresses', {
        label: form.label.trim(),
        fullAddress: form.fullAddress.trim(),
        latitude: 0,
        longitude: 0,
      });
      setModalOpen(false);
      await refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create address.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address: Address) => {
    if (!window.confirm(`Delete address "${address.label}"?`)) return;
    try {
      await api.delete(`/addresses/${address.id}`);
      await refetch();
    } catch {
      alert('Failed to delete address.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>My Addresses</h1>
        <button style={styles.addButton} onClick={openModal}>+ Add Address</button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div style={styles.grid}>
          {!addresses || addresses.length === 0 ? (
            <div style={styles.empty}>No addresses yet. Click "Add Address" to create one.</div>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} style={styles.addressCard}>
                <div style={styles.label}>{addr.label}</div>
                <div style={styles.fullAddress}>{addr.fullAddress}</div>
                <button style={styles.deleteBtn} onClick={() => handleDelete(addr)}>Delete</button>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <div style={styles.overlay} onClick={() => !saving && setModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Add Address</div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Label</label>
              <input style={styles.input} placeholder="e.g. Home, Work" value={form.label} onChange={(e) => updateField('label', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Full Address</label>
              <input style={styles.input} placeholder="e.g. KN 5 Rd, Kigali" value={form.fullAddress} onChange={(e) => updateField('fullAddress', e.target.value)} />
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={submitAddress} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
