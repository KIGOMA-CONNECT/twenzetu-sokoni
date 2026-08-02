import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import type { Address } from '../../types';

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
    <div className="page">
      <PageHeader
        title="My Addresses"
        action={<button className="btn btn-primary" onClick={openModal}>+ Add Address</button>}
      />

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        !addresses || addresses.length === 0 ? (
          <EmptyState icon="📍" title="No addresses yet" sub='Click "Add Address" to create one' />
        ) : (
          <div className="grid grid-auto-lg">
            {addresses.map((addr) => (
              <div key={addr.id} className="card card-hover">
                <div className="flex justify-between items-center mb-1">
                  <span className="badge badge-brand">📍 {addr.label}</span>
                  {addr.isDefault && <span className="badge badge-green">Default</span>}
                </div>
                <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>{addr.fullAddress}</p>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(addr)}>Delete</button>
              </div>
            ))}
          </div>
        )
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📍 Add Address</div>
            <div className="field">
              <label className="field-label">Label</label>
              <input className="input" placeholder="e.g. Home, Work" value={form.label} onChange={(e) => updateField('label', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Full Address</label>
              <input className="input" placeholder="e.g. KN 5 Rd, Kigali" value={form.fullAddress} onChange={(e) => updateField('fullAddress', e.target.value)} />
            </div>
            {formError && <div className="alert alert-error mb-1">⚠️ {formError}</div>}
            <div className="flex justify-between gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAddress} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
