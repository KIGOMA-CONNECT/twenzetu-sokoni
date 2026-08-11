import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import type { VendorStaffMember, VendorStaffRole } from '../../types';

interface StaffResponse {
  vendorId: string;
  shopName: string;
  staff: VendorStaffMember[];
}

interface InviteForm {
  phoneNumber: string;
  fullName: string;
  role: VendorStaffRole;
}

const ROLES: VendorStaffRole[] = ['manager', 'cashier'];

const ROLE_LABELS: Record<VendorStaffRole, string> = {
  manager: 'Manager',
  cashier: 'Cashier',
};

const ROLE_HINTS: Record<VendorStaffRole, string> = {
  manager: 'Manage products, orders and deliveries',
  cashier: 'Use POS at the counter',
};

const emptyForm: InviteForm = { phoneNumber: '', fullName: '', role: 'cashier' };

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' },
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
  select: { padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155' },
  deleteBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#dc2626' },
  notice: { background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '0.9rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '420px', maxWidth: '90vw', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  hint: { fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#334155' },
  saveBtn: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  saveBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  smallError: { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' },
};

export default function VendorStaff() {
  const { isVendorOwner } = useAuth();
  const { data: raw, loading, error, refetch } = useApi<StaffResponse>('/vendor-staff');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<InviteForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const staff: VendorStaffMember[] = Array.isArray(raw) ? raw : (raw?.staff ?? []);

  const openModal = () => {
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const updateField = (field: keyof InviteForm, value: string | VendorStaffRole) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitInvite = async () => {
    const phone = form.phoneNumber.trim();
    const name = form.fullName.trim();
    if (!phone || !name) {
      setFormError('Phone number and full name are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/vendor-staff/invite', {
        phoneNumber: phone,
        fullName: name,
        role: form.role,
      });
      setModalOpen(false);
      await refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to invite staff.');
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (member: VendorStaffMember, role: VendorStaffRole) => {
    try {
      await api.patch(`/vendor-staff/${member.id}`, { role });
      await refetch();
    } catch {
      alert('Failed to update role.');
    }
  };

  const removeStaff = async (member: VendorStaffMember) => {
    if (!window.confirm(`Remove ${member.fullName || member.phoneNumber || 'this person'} from your staff?`)) return;
    try {
      await api.delete(`/vendor-staff/${member.id}`);
      await refetch();
    } catch {
      alert('Failed to remove staff member.');
    }
  };

  if (!isVendorOwner) {
    return (
      <div style={styles.container}>
        <div style={styles.notice}>Only the shop owner can manage staff. If you were just invited, log out and back in to refresh your access.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Staff</h1>
          <div style={styles.subtitle}>Invite your team and control what each person can do.</div>
        </div>
        <button style={styles.addButton} onClick={openModal}>+ Invite Staff</button>
      </div>

      <div style={styles.card}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ padding: '1rem' }}><ErrorMessage message={error} /></div>
        ) : staff.length === 0 ? (
          <div style={styles.empty}>No staff yet. Click "Invite Staff" to add your first team member.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td style={styles.td}>{member.fullName || '—'}</td>
                  <td style={styles.td}>{member.phoneNumber || '—'}</td>
                  <td style={styles.td}>
                    <select
                      style={styles.select}
                      value={member.role}
                      onChange={(e) => changeRole(member, e.target.value as VendorStaffRole)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={styles.td}><StatusBadge status={member.status} /></td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button style={styles.deleteBtn} onClick={() => removeStaff(member)}>Remove</button>
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
            <div style={styles.modalTitle}>Invite Staff</div>
            <div style={styles.field}>
              <label style={styles.label}>Phone Number</label>
              <input style={styles.input} value={form.phoneNumber} placeholder="+255..." onChange={(e) => updateField('phoneNumber', e.target.value)} />
              <div style={styles.hint}>If they don't have an account yet, one will be created automatically.</div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Role</label>
              <select style={styles.input} value={form.role} onChange={(e) => updateField('role', e.target.value as VendorStaffRole)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <div style={styles.hint}>{ROLE_HINTS[form.role]}</div>
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={submitInvite} disabled={saving}>
                {saving ? 'Sending…' : 'Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
