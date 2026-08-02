import { useState } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import { VENDOR_CATEGORIES } from '../../constants/categories';
import type { ServiceListing, ServiceRequest, ServiceMessage } from '../../types';

interface ListingForm {
  name: string;
  description: string;
  category: string;
  pricingModel: string;
  basePrice: number;
  unitLabel: string;
  imageUrl: string;
}

const PRICING_MODELS = [
  { value: 'per_sqm', label: 'Per m² (e.g. painting, tiling, fumigation)' },
  { value: 'per_hour', label: 'Per hour (e.g. plumbing, electrical)' },
  { value: 'per_room', label: 'Per room (e.g. deep cleaning)' },
  { value: 'per_unit', label: 'Per unit (e.g. tailoring, laundry item)' },
];

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.5rem', flexWrap: 'wrap' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  tabWrap: { display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' },
  tab: { padding: '0.5rem 1rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#334155' },
  tabActive: { background: '#1e40af', color: '#fff', borderColor: '#1e40af' },
  addButton: { background: '#1e40af', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  empty: { textAlign: 'center', color: '#64748b', padding: '2rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '480px', maxWidth: '90vw', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
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
  smallNote: { fontSize: '0.78rem', color: '#64748b' },
  reqRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', gap: '1rem', flexWrap: 'wrap' },
  buttonSecondary: { padding: '0.45rem 0.85rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#334155' },
  chatBox: { border: '1px solid #e2e8f0', borderRadius: '8px', height: '220px', overflowY: 'auto', padding: '0.75rem', marginBottom: '0.75rem', background: '#f8fafc' },
  chatMsg: { marginBottom: '0.5rem', fontSize: '0.85rem' },
  chatMe: { textAlign: 'right' },
  chatBubble: { display: 'inline-block', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.7rem', maxWidth: '80%' },
  chatBubbleMe: { background: '#1e40af', color: '#fff', borderColor: '#1e40af' },
};

const emptyForm: ListingForm = { name: '', description: '', category: '', pricingModel: 'per_sqm', basePrice: 0, unitLabel: '', imageUrl: '' };

export default function VendorServices() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [tab, setTab] = useState<'listings' | 'requests'>('listings');

  const { data: listings, loading: loadingListings, error: listingsError, refetch: refetchListings } = useApi<ServiceListing[]>('/services/listings?vendorId=mine');
  const { data: reqRaw, loading: loadingReqs, error: reqsError, refetch: refetchReqs } = useApi<ServiceRequest[]>('/services/requests?status=');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [activeReq, setActiveReq] = useState<ServiceRequest | null>(null);
  const [messages, setMessages] = useState<ServiceMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMsg, setQuoteMsg] = useState('');
  const [quoteBusy, setQuoteBusy] = useState(false);

  const myListings: ServiceListing[] = Array.isArray(listings) ? listings : ((listings as any)?.data ?? []);
  const requests: ServiceRequest[] = Array.isArray(reqRaw) ? reqRaw : ((reqRaw as any)?.data ?? []);

  const openModal = () => {
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const submitListing = async () => {
    if (!form.name.trim() || !form.category || !form.pricingModel || form.basePrice <= 0) {
      setFormError('Name, category, pricing model, and a positive base price are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/services/listings', {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        pricingModel: form.pricingModel,
        basePrice: Number(form.basePrice),
        currency: 'TZS',
        unitLabel: form.unitLabel.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
      });
      setModalOpen(false);
      await refetchListings();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create listing');
    } finally {
      setSaving(false);
    }
  };

  const deleteListing = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This is permanent and blocked while it has active requests.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/services/listings/${id}`);
      await refetchListings();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  const openThread = async (req: ServiceRequest) => {
    setActiveReq(req);
    setMessages([]);
    setMessageText('');
    setQuotePrice('');
    setQuoteMsg('');
    try {
      const res = await api.get(`/services/requests/${req.id}/messages`);
      const payload = res.data?.data ?? [];
      setMessages(Array.isArray(payload) ? payload : []);
    } catch { setMessages([]); }
  };

  const sendMessage = async () => {
    if (!activeReq || !messageText.trim()) return;
    const text = messageText.trim();
    setMessageText('');
    try {
      await api.post('/services/messages', { requestId: activeReq.id, message: text });
      setMessages((m) => [...m, { id: `temp-${Date.now()}`, requestId: activeReq.id, senderId: user?.id || '', senderName: user?.fullName || user?.phoneNumber || 'You', senderRole: 'vendor', message: text, createdAt: new Date().toISOString() }]);
      const res = await api.get(`/services/requests/${activeReq.id}/messages`);
      const payload = res.data?.data ?? [];
      setMessages(Array.isArray(payload) ? payload : []);
    } catch { setMessageText(text); }
  };

  const submitQuote = async () => {
    if (!activeReq || !quotePrice) return;
    setQuoteBusy(true);
    try {
      await api.post('/services/quotes', {
        requestId: activeReq.id,
        price: Number(quotePrice),
        currency: 'TZS',
        message: quoteMsg.trim() || undefined,
      });
      setQuotePrice('');
      setQuoteMsg('');
      await refetchReqs();
      const refreshed = await api.get('/services/requests?status=');
      const payload = refreshed.data?.data ?? refreshed.data?.data ?? [];
      const list = Array.isArray(payload) ? payload : ((payload as any)?.data ?? []);
      const updated = list.find((r: ServiceRequest) => r.id === activeReq.id);
      if (updated) setActiveReq(updated);
      alert('Quote submitted. The customer will be notified.');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to submit quote');
    } finally {
      setQuoteBusy(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>My Services</h1>
        {tab === 'listings' && <button style={styles.addButton} onClick={openModal}>+ Add Service</button>}
      </div>

      <div style={styles.tabWrap}>
        <button style={{ ...styles.tab, ...(tab === 'listings' ? styles.tabActive : {}) }} onClick={() => setTab('listings')}>My Listings ({myListings.length})</button>
        <button style={{ ...styles.tab, ...(tab === 'requests' ? styles.tabActive : {}) }} onClick={() => { setTab('requests'); refetchReqs(); }}>Service Requests ({requests.length})</button>
      </div>

      {tab === 'listings' && (
        <div style={styles.card}>
          {loadingListings ? (
            <LoadingSpinner />
          ) : listingsError ? (
            <div style={{ padding: '1rem' }}><ErrorMessage message={listingsError} /></div>
          ) : myListings.length === 0 ? (
            <div style={styles.empty}>No service listings yet. Click "Add Service" to create one.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Service</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Pricing</th>
                  <th style={styles.th}>Base Price</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {myListings.map((l) => {
                  const cat = VENDOR_CATEGORIES.find((c) => c.key === l.category);
                  return (
                    <tr key={l.id}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 700 }}>{l.name}</div>
                        <div style={styles.smallNote}>{l.description}</div>
                      </td>
                      <td style={styles.td}>{cat?.emoji} {cat?.label ?? l.category}</td>
                      <td style={styles.td}>{l.pricingModel.replace('_', ' ')}{l.unitLabel ? ` (${l.unitLabel})` : ''}</td>
                      <td style={styles.td}>{formatCurrency(l.basePrice)}</td>
                      <td style={styles.td}><StatusBadge status={l.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button style={{ ...styles.buttonSecondary, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => deleteListing(l.id, l.name)} disabled={deletingId === l.id}>
                          {deletingId === l.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div style={styles.card}>
          {loadingReqs ? (
            <LoadingSpinner />
          ) : reqsError ? (
            <div style={{ padding: '1rem' }}><ErrorMessage message={reqsError} /></div>
          ) : requests.length === 0 ? (
            <div style={styles.empty}>No service requests yet. When customers request your services they'll appear here.</div>
          ) : (
            requests.map((r) => (
              <div key={r.id} style={styles.reqRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.title}</div>
                  <div style={styles.smallNote}>{r.quantity} {r.unitLabel} • {r.details || 'No details'}</div>
                  {r.photoUrls?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
                      {r.photoUrls.slice(0, 4).map((u, i) => <img key={i} src={u} alt={`req ${i + 1}`} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />)}
                    </div>
                  )}
                  {r.agreedPrice ? <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>Agreed: {formatCurrency(r.agreedPrice)}</div> : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={r.status} />
                  <div style={{ marginTop: '0.5rem' }}>
                    <button style={styles.buttonSecondary} onClick={() => openThread(r)}>Quote &amp; Chat</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <div style={styles.overlay} onClick={() => !saving && setModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Add Service Listing</div>
            <div style={styles.field}>
              <label style={styles.label}>Service Name</label>
              <input style={styles.input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea style={styles.textarea} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Category</label>
              <select style={styles.input} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">Select category…</option>
                {VENDOR_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Pricing Model</label>
              <select style={styles.input} value={form.pricingModel} onChange={(e) => setForm((f) => ({ ...f, pricingModel: e.target.value }))}>
                {PRICING_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Base Price (TZS)</label>
              <input type="number" min={0} style={styles.input} value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Unit Label (e.g. m², hour, room)</label>
              <input style={styles.input} value={form.unitLabel} onChange={(e) => setForm((f) => ({ ...f, unitLabel: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Image URL (optional)</label>
              <input style={styles.input} value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={submitListing} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeReq && (
        <div style={styles.overlay} onClick={() => setActiveReq(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Service Request — {activeReq.title}</div>
            <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.75rem' }}>
              {activeReq.quantity} {activeReq.unitLabel} • {activeReq.details || 'No details'}
            </div>
            {activeReq.photoUrls?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {activeReq.photoUrls.map((u, i) => <img key={i} src={u} alt={`req ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6 }} />)}
              </div>
            )}
            {activeReq.status === 'PENDING' && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Submit Quote</div>
                <div style={styles.field}>
                  <label style={styles.label}>Price (TZS)</label>
                  <input type="number" min={0} style={styles.input} value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Message (optional)</label>
                  <textarea style={styles.textarea} value={quoteMsg} onChange={(e) => setQuoteMsg(e.target.value)} />
                </div>
                <button style={styles.saveBtn} onClick={submitQuote} disabled={quoteBusy}>{quoteBusy ? 'Sending…' : 'Send Quote'}</button>
              </div>
            )}
            {activeReq.status !== 'PENDING' && (
              <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#334155' }}>
                Request status: <StatusBadge status={activeReq.status} />
              </div>
            )}
            <div style={styles.chatBox}>
              {messages.length === 0 && <div style={styles.smallNote}>No messages yet.</div>}
              {messages.map((m) => (
                <div key={m.id} style={{ ...styles.chatMsg, ...(m.senderId === user?.id ? styles.chatMe : {}) }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.senderName} · {new Date(m.createdAt).toLocaleTimeString()}</span>
                  <div>
                    <span style={{ ...styles.chatBubble, ...(m.senderId === user?.id ? styles.chatBubbleMe : {}) }}>{m.message}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input style={styles.input} placeholder="Type a message…" value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} />
              <button style={{ ...styles.buttonSecondary, whiteSpace: 'nowrap' }} onClick={sendMessage}>Send</button>
            </div>
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setActiveReq(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
