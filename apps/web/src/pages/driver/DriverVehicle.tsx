import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Vehicle } from '../../types';

const VEHICLE_TYPES = ['boda', 'bajaji', 'carry', 'guta', 'fuso'];

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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '420px', maxWidth: '90vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#334155' },
  saveBtn: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  saveBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  smallError: { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' },
};

interface NewVehicle {
  vehicleType: string;
  plateNumber: string;
  capacityKg: number;
}

const emptyForm: NewVehicle = { vehicleType: '', plateNumber: '', capacityKg: 0 };

export default function DriverVehicle() {
  const { data: vehicles, loading, error, refetch } = useApi<Vehicle[]>('/fleet/vehicles/me');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewVehicle>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openModal = () => {
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const updateField = (field: keyof NewVehicle, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitVehicle = async () => {
    if (!form.vehicleType || !form.plateNumber.trim()) {
      setFormError('Vehicle type and plate number are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/fleet/vehicles', {
        vehicleType: form.vehicleType,
        plateNumber: form.plateNumber.trim(),
        capacityKg: Number(form.capacityKg) || 0,
      });
      setModalOpen(false);
      await refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to register vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const all = vehicles || [];

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>My Vehicles</h1>
        <button style={styles.addButton} onClick={openModal}>+ Register Vehicle</button>
      </div>

      <div style={styles.card}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ padding: '1rem' }}><ErrorMessage message={error} /></div>
        ) : all.length === 0 ? (
          <div style={styles.empty}>No vehicles registered yet. Click "Register Vehicle" to add one.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Plate Number</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {all.map((v) => (
                <tr key={v.id}>
                  <td style={styles.td}>{v.vehicleType}</td>
                  <td style={styles.td}>{v.plateNumber}</td>
                  <td style={styles.td}><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div style={styles.overlay} onClick={() => !saving && setModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Register Vehicle</div>
            <div style={styles.field}>
              <label style={styles.label}>Vehicle Type</label>
              <select
                style={styles.input}
                value={form.vehicleType}
                onChange={(e) => updateField('vehicleType', e.target.value)}
              >
                <option value="">Select type…</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Plate Number</label>
              <input
                style={styles.input}
                value={form.plateNumber}
                onChange={(e) => updateField('plateNumber', e.target.value)}
                placeholder="e.g. MC722 DAC"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Capacity (kg)</label>
              <input
                type="number"
                min={0}
                style={styles.input}
                value={form.capacityKg}
                onChange={(e) => updateField('capacityKg', parseInt(e.target.value, 10) || 0)}
              />
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={submitVehicle} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
