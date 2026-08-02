import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import { VENDOR_CATEGORIES } from '../../constants/categories';
import type { ServiceListing, ServiceRequest, ServiceQuote, ServiceMessage } from '../../types';

const SERVICE_CATEGORIES = ['cleaning', 'tailoring', 'laundry', 'food', 'general'];

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.5rem', flexWrap: 'wrap' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  tabWrap: { display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' },
  tab: { padding: '0.5rem 1rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#334155' },
  tabActive: { background: '#1e40af', color: '#fff', borderColor: '#1e40af' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  listingImage: { width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', background: '#f1f5f9' },
  listingName: { fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0.6rem 0 0.2rem' },
  listingDesc: { fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.6rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties,
  badge: { fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px', background: '#eff6ff', color: '#1e40af', display: 'inline-block', marginBottom: '0.5rem' },
  button: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, width: '100%' },
  buttonSecondary: { padding: '0.45rem 0.85rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#334155' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '560px', maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  smallError: { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' },
  smallNote: { fontSize: '0.78rem', color: '#64748b' },
  empty: { textAlign: 'center', color: '#64748b', padding: '2.5rem' },
  reqRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', gap: '1rem', flexWrap: 'wrap' },
  chatBox: { border: '1px solid #e2e8f0', borderRadius: '8px', height: '220px', overflowY: 'auto', padding: '0.75rem', marginBottom: '0.75rem', background: '#f8fafc' },
  chatMsg: { marginBottom: '0.5rem', fontSize: '0.85rem' },
  chatMe: { textAlign: 'right' },
  chatBubble: { display: 'inline-block', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.7rem', maxWidth: '80%' },
  chatBubbleMe: { background: '#1e40af', color: '#fff', borderColor: '#1e40af' },
  quoteRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' },
  select: { padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', background: '#fff', cursor: 'pointer', color: '#334155' },
};

const unitLabelFor = (m: string) => (m === 'per_sqm' ? 'm²' : m === 'per_hour' ? 'hour' : m === 'per_room' ? 'room' : 'unit');

export default function ConsumerServices() {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [tab, setTab] = useState<'browse' | 'requests'>('browse');

  const { data: listings, loading: loadingListings, error: listingsError, refetch: refetchListings } = useApi<ServiceListing[]>(
    category ? `/services/listings?category=${encodeURIComponent(category)}` : '/services/listings',
    [category],
  );
  const { data: reqRaw, loading: loadingReqs, error: reqsError, refetch: refetchReqs } = useApi<ServiceRequest[]>('/services/requests');

  const [selected, setSelected] = useState<ServiceListing | null>(null);
  const [requestForm, setRequestForm] = useState({ quantity: 1, unitLabel: '', details: '' });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [activeReq, setActiveReq] = useState<ServiceRequest | null>(null);
  const [messages, setMessages] = useState<ServiceMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [acceptModal, setAcceptModal] = useState<ServiceQuote | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [accepting, setAccepting] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<ServiceRequest | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const myRequests: ServiceRequest[] = Array.isArray(reqRaw) ? reqRaw : ((reqRaw as any)?.data ?? []);

  const openRequest = (listing: ServiceListing) => {
    setSelected(listing);
    setRequestForm({ quantity: 1, unitLabel: unitLabelFor(listing.pricingModel), details: '' });
    setPhotoUrls([]);
    setFormError(null);
  };

  const uploadPhoto = async (file: File) => {
    if (photoUrls.length >= 4) { setFormError('Maximum 4 photos'); return; }
    setUploading(true);
    setFormError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/uploads/product-image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.data?.url || res.data?.url;
      if (url) setPhotoUrls((p) => [...p, url]);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submitRequest = async () => {
    if (!selected) return;
    if (requestForm.quantity <= 0) { setFormError('Quantity must be positive'); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/services/requests', {
        vendorId: selected.vendorId,
        listingId: selected.id,
        title: selected.name,
        quantity: Number(requestForm.quantity),
        unitLabel: requestForm.unitLabel || unitLabelFor(selected.pricingModel),
        details: requestForm.details.trim(),
        photoUrls,
        currency: selected.currency,
      });
      setSelected(null);
      setTab('requests');
      await refetchReqs();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const openThread = async (req: ServiceRequest) => {
    setActiveReq(req);
    setMessages([]);
    setMessageText('');
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
      setMessages((m) => [...m, { id: `temp-${Date.now()}`, requestId: activeReq.id, senderId: user?.id || '', senderName: user?.fullName || user?.phoneNumber || 'You', senderRole: user?.role || 'customer', message: text, createdAt: new Date().toISOString() }]);
      const res = await api.get(`/services/requests/${activeReq.id}/messages`);
      const payload = res.data?.data ?? [];
      setMessages(Array.isArray(payload) ? payload : []);
    } catch { setMessageText(text); }
  };

  const openAccept = (quote: ServiceQuote) => {
    setAcceptModal(quote);
    setPaymentMethod('mpesa');
    setDeliveryAddress('');
    setSpecialInstructions('');
  };

  const acceptQuote = async () => {
    if (!acceptModal) return;
    setAccepting(true);
    try {
      const res = await api.post('/services/quotes/accept', {
        quoteId: acceptModal.id,
        paymentMethod,
        deliveryAddress: deliveryAddress.trim() || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
      });
      const data = res.data?.data ?? res.data;
      setAcceptModal(null);
      if (activeReq) await openThread(activeReq);
      await refetchReqs();
      if (paymentMethod === 'cash') {
        alert('Quote accepted. Order created — pay in cash on delivery.');
      } else if (data?.otpCode) {
        alert(`Quote accepted. Payment request sent to your phone (${paymentMethod.replace('_', ' ')}).\nComplete the STK push and keep this OTP: ${data.otpCode}`);
      } else {
        alert('Quote accepted. Order created — check My Orders for payment confirmation.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to accept quote');
    } finally {
      setAccepting(false);
    }
  };

  const openReview = (req: ServiceRequest) => {
    setReviewTarget(req);
    setReviewRating(5);
    setReviewComment('');
    setReviewError(null);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setReviewBusy(true);
    setReviewError(null);
    try {
      await api.post(`/services/requests/${reviewTarget.id}/review`, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewTarget(null);
      alert('Thank you for your review!');
    } catch (err: any) {
      setReviewError(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setReviewBusy(false);
    }
  };

  const estimate = (l: ServiceListing) => l.basePrice * (l.pricingModel === 'per_unit' ? 1 : Math.max(1, requestForm.quantity || 1));

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Services</h1>
      </div>

      <div style={styles.tabWrap}>
        <button style={{ ...styles.tab, ...(tab === 'browse' ? styles.tabActive : {}) }} onClick={() => setTab('browse')}>Browse Services</button>
        <button style={{ ...styles.tab, ...(tab === 'requests' ? styles.tabActive : {}) }} onClick={() => { setTab('requests'); refetchReqs(); }}>My Requests ({myRequests.length})</button>
      </div>

      {tab === 'browse' && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: '0.25rem' }}>
            <button style={{ ...styles.tab, ...(!category ? styles.tabActive : {}) }} onClick={() => setSearchParams({})}>All</button>
            {SERVICE_CATEGORIES.map((c) => {
              const def = VENDOR_CATEGORIES.find((v) => v.key === c);
              return (
                <button key={c} style={{ ...styles.tab, ...(category === c ? styles.tabActive : {}) }} onClick={() => setSearchParams({ category: c })}>
                  {def?.emoji} {def?.label ?? c}
                </button>
              );
            })}
          </div>

          {loadingListings ? (
            <LoadingSpinner />
          ) : listingsError ? (
            <ErrorMessage message={listingsError} />
          ) : !listings || listings.length === 0 ? (
            <div style={{ ...styles.card, ...styles.empty }}>No service listings yet in this category. Check back soon!</div>
          ) : (
            <div style={styles.grid}>
              {(Array.isArray(listings) ? listings : []).map((l) => (
                <div key={l.id} style={styles.card}>
                  {l.imageUrl ? <img src={l.imageUrl} alt={l.name} style={styles.listingImage} /> : <div style={{ ...styles.listingImage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🧰</div>}
                  <span style={styles.badge}>{l.pricingModel.replace('_', ' ')}</span>
                  <h3 style={styles.listingName}>{l.name}</h3>
                  <p style={styles.listingDesc}>{l.description}</p>
                  {l.vendorRating ? (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem' }}>
                      ⭐ {l.vendorRating.toFixed(1)} {l.vendorName ? `· ${l.vendorName}` : ''}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>No ratings yet</div>
                  )}
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
                    {formatCurrency(l.basePrice)}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}> / {l.unitLabel || unitLabelFor(l.pricingModel)}</span>
                  </div>
                  <button style={styles.button} onClick={() => openRequest(l)}>Request Service</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <div style={styles.card}>
          {loadingReqs ? (
            <LoadingSpinner />
          ) : reqsError ? (
            <ErrorMessage message={reqsError} />
          ) : myRequests.length === 0 ? (
            <div style={styles.empty}>You have no service requests yet. Browse services and request one!</div>
          ) : (
            myRequests.map((r) => (
              <div key={r.id} style={styles.reqRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.title}</div>
                  <div style={styles.smallNote}>{r.quantity} {r.unitLabel} • {new Date(r.createdAt).toLocaleDateString()}</div>
                  {r.agreedPrice ? <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>Agreed: {formatCurrency(r.agreedPrice)}</div> : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={r.status} />
                  <div style={{ marginTop: '0.5rem' }}>
                    <button style={styles.buttonSecondary} onClick={() => openThread(r)}>Chat &amp; Quotes</button>
                    {r.status === 'ORDERED' && (
                      <button style={{ ...styles.buttonSecondary, marginLeft: '0.4rem', color: '#1e40af', borderColor: '#bfdbfe' }} onClick={() => openReview(r)}>Rate Service</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selected && (
        <div style={styles.overlay} onClick={() => !submitting && setSelected(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Request Service — {selected.name}</div>
            <div style={styles.field}>
              <label style={styles.label}>Quantity ({selected.unitLabel || unitLabelFor(selected.pricingModel)})</label>
              <input type="number" min={1} style={styles.input} value={requestForm.quantity} onChange={(e) => setRequestForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 1 }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Unit Label</label>
              <input style={styles.input} value={requestForm.unitLabel} onChange={(e) => setRequestForm((f) => ({ ...f, unitLabel: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Details (what you need done)</label>
              <textarea style={styles.textarea} value={requestForm.details} onChange={(e) => setRequestForm((f) => ({ ...f, details: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Photos (up to 4)</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {photoUrls.map((u, i) => <img key={i} src={u} alt={`photo ${i + 1}`} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />)}
                {photoUrls.length < 4 && (
                  <label style={{ ...styles.buttonSecondary, cursor: 'pointer', display: 'inline-block' }}>
                    {uploading ? 'Uploading…' : '+ Add Photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 700, margin: '0.5rem 0' }}>
              Estimated: {formatCurrency(estimate(selected))}
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.buttonSecondary} onClick={() => setSelected(null)} disabled={submitting}>Cancel</button>
              <button style={styles.button} onClick={submitRequest} disabled={submitting} className="btn-primary">
                {submitting ? 'Submitting…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeReq && (
        <div style={styles.overlay} onClick={() => setActiveReq(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Negotiation — {activeReq.title}</div>
            <div style={styles.chatBox}>
              {messages.length === 0 && <div style={styles.smallNote}>No messages yet. Introduce your request to the vendor.</div>}
              {messages.map((m) => (
                <div key={m.id} style={{ ...styles.chatMsg, ...(m.senderId === user?.id ? styles.chatMe : {}) }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.senderName} · {new Date(m.createdAt).toLocaleTimeString()}</span>
                  <div>
                    <span style={{ ...styles.chatBubble, ...(m.senderId === user?.id ? styles.chatBubbleMe : {}) }}>{m.message}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input style={styles.input} placeholder="Type a message…" value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} />
              <button style={{ ...styles.buttonSecondary, whiteSpace: 'nowrap' }} onClick={sendMessage}>Send</button>
            </div>
            {(activeReq.quotes?.length || 0) > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Vendor Quotes</div>
                {activeReq.quotes?.map((q) => (
                  <div key={q.id} style={styles.quoteRow}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(q.price)}</span>
                      <div style={styles.smallNote}>{q.message || 'No message'}</div>
                    </div>
                    {q.status === 'OPEN' && activeReq.status !== 'ORDERED' && activeReq.status !== 'CANCELLED' && (
                      <button style={styles.button} onClick={() => openAccept(q)} className="btn-primary">Accept</button>
                    )}
                    {q.status !== 'OPEN' && <StatusBadge status={q.status} />}
                  </div>
                ))}
              </div>
            )}
            <div style={styles.footer}>
              <button style={styles.buttonSecondary} onClick={() => setActiveReq(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {acceptModal && (
        <div style={styles.overlay} onClick={() => !accepting && setAcceptModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Confirm &amp; Pay — {formatCurrency(acceptModal.price)}</div>
            <div style={styles.field}>
              <label style={styles.label}>Payment Method</label>
              <select style={styles.select} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="mpesa">M-Pesa</option>
                <option value="tigo_money">Tigo Pesa</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="cash">Cash on Delivery</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Delivery Address</label>
              <input style={styles.input} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Special Instructions</label>
              <textarea style={styles.textarea} value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
            </div>
            <div style={styles.footer}>
              <button style={styles.buttonSecondary} onClick={() => setAcceptModal(null)} disabled={accepting}>Cancel</button>
              <button style={styles.button} onClick={acceptQuote} disabled={accepting} className="btn-primary">
                {accepting ? 'Processing…' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
      {reviewTarget && (
        <div style={styles.overlay} onClick={() => !reviewBusy && setReviewTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Rate Service — {reviewTarget.title}</div>
            <div style={styles.field}>
              <label style={styles.label}>Your Rating</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    style={{
                      fontSize: '1.6rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      opacity: n <= reviewRating ? 1 : 0.3,
                    }}
                    aria-label={`${n} stars`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Comment (optional)</label>
              <textarea style={styles.textarea} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How was the service?" />
            </div>
            {reviewError && <div style={styles.smallError}>{reviewError}</div>}
            <div style={styles.footer}>
              <button style={styles.buttonSecondary} onClick={() => setReviewTarget(null)} disabled={reviewBusy}>Cancel</button>
              <button style={styles.button} onClick={submitReview} disabled={reviewBusy} className="btn-primary">
                {reviewBusy ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
