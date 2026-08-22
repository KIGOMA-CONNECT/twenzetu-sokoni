import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '../../hooks/useDevice';
import { SectionTitle } from '../../components/ui';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useApi } from '../../hooks/useApi';
import api from '../../api/client';
import type { Vendor } from '../../types';

const FABRICS = [
  { id: 'cotton', name: 'Khanga / Kitenge', emoji: '🧵', desc: 'Kihabari, kisemaji' },
  { id: 'silk', name: 'Silk / Satin', emoji: '✨', desc: 'Laini, ya kifahari' },
  { id: 'denim', name: 'Denim / Jeans', emoji: '👖', desc: 'Mtz, wa kila siku' },
  { id: 'leather', name: 'Leather / Ngozi', emoji: '👜', desc: 'Mtz, wa muda mrefu' },
  { id: 'chiffon', name: 'Chiffon / Georgette', emoji: '🪭', desc: 'Nyepesi, ya harusi' },
  { id: 'canvas', name: 'Canvas / Khaki', emoji: '🎒', desc: 'Mtz, nguvu' },
];

const STYLES = [
  { id: 'dress', name: 'Gauni / Dress', emoji: '👗' },
  { id: 'suit', name: 'Suit / Blazer', emoji: '👔' },
  { id: 'kikoi', name: 'Kikoi / Shuka', emoji: '🩱' },
  { id: 'uniform', name: 'Uniform / Kazi', emoji: '🦺' },
  { id: 'trousers', name: 'Suruali / Trousers', emoji: '👖' },
  { id: 'shirt', name: 'Shati / Shirt', emoji: '👕' },
  { id: 'skirt', name: 'Sketi / Skirt', emoji: '🩳' },
  { id: 'custom', name: 'Custom / Nyingine', emoji: '✏️' },
];

const SUBCATEGORIES = [
  { id: 'd0000000-0000-0000-0000-000000000070', name: 'Nguo za Kiume', emoji: '👔' },
  { id: 'd0000000-0000-0000-0000-000000000071', name: 'Nguo za Kike', emoji: '👗' },
  { id: 'd0000000-0000-0000-0000-000000000072', name: 'Vazi la Harusi', emoji: '👰' },
  { id: 'd0000000-0000-0000-0000-000000000073', name: 'Uniforms na Workwear', emoji: '🦺' },
];

const CUSTOM_TAILORING_PRODUCT_ID = '00000000-0000-4000-8000-000000000001';

export default function TailoringOrderPage() {
  const navigate = useNavigate();
  const device = useDevice();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [subcat, setSubcat] = useState('');
  const [fabric, setFabric] = useState('');
  const [style, setStyle] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState({
    chest: '', waist: '', hips: '', shoulders: '', length: '', sleeves: '',
  });
  const [voiceNote, setVoiceNote] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ orderId?: string; otpCode?: string } | null>(null);
  const isPhone = device.type === 'phone';
  const { data: tailors, loading: tailorsLoading, error: tailorsError } = useApi<Vendor[]>(
    step === 1 ? '/public/vendors?category=tailoring' : null,
    [step],
  );

  const canProceed = () => {
    if (step === 1) return !!subcat;
    if (step === 2) return !!fabric && !!style;
    return true;
  };

  async function handleSubmit() {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    setOrderError(null);
    setSubmitting(true);
    try {
      const subcatName = SUBCATEGORIES.find((s) => s.id === subcat)?.name ?? subcat;
      const fabricName = FABRICS.find((f) => f.id === fabric)?.name ?? fabric;
      const styleName = STYLES.find((s) => s.id === style)?.name ?? style;
      const measurementSummary = Object.entries(measurements)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}cm`)
        .join(', ');
      const res = await api.post('/orders', {
        vendorId,
        type: 'service',
        deliveryAddress: 'Itaainishwa na mshonaji baada ya mazungumzo',
        specialInstructions: `Vipimo: ${measurementSummary || 'yatatumwa'}${notes ? `. Maelezo: ${notes}` : ''}`,
        items: [{
          productId: CUSTOM_TAILORING_PRODUCT_ID,
          productName: `Ushonaji: ${styleName} — ${subcatName} (Kitambaa: ${fabricName})`,
          quantity: 1,
          unitPrice: 0,
        }],
        paymentMethod: 'cash',
      });
      const payload = res.data?.data ?? res.data;
      setPlacedOrder({ orderId: payload?.orderId, otpCode: payload?.otpCode });
      setStep(4);
    } catch (err: any) {
      setOrderError(err?.response?.data?.message || err?.message || 'Imeshindikana kutuma oda. Jaribu tena.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ paddingTop: device.safeAreaInsets.top || undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => step === 1 ? navigate(-1) : setStep((s) => (s - 1) as 1 | 2 | 3 | 4)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>←</button>
        <div>
          <h1 style={{ fontSize: isPhone ? '1.2rem' : '1.5rem', fontWeight: 800 }}>✂️ Ushonaji na Tailoring</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Chagua aina ya nguo, kitambaa, na vipimo</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'var(--brand)' : 'var(--line)' }} />
        ))}
      </div>

      {/* Step 1: Choose category + tailor */}
      {step === 1 && (
        <div>
          <SectionTitle title="Aina ya nguo" emoji="👗" />
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {SUBCATEGORIES.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSubcat(s.id); setStep(2); }}
                style={{
                  padding: '1rem', borderRadius: 'var(--radius-lg)', border: subcat === s.id ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: subcat === s.id ? 'var(--brand-soft)' : 'var(--surface)', cursor: 'pointer', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{s.emoji}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{s.name}</div>
              </button>
            ))}
          </div>

          <SectionTitle title="Chagua mshonaji" emoji="🧑‍🎨" />
          {tailorsLoading && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Inapakia washonaji...</p>}
          {tailorsError && <ErrorMessage message={tailorsError} />}
          {!tailorsLoading && !tailorsError && (tailors || []).length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Hakuna mshonaji aliyesajiliwa kwa sasa. Tafadhali jaribu tena baadaye.
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {(tailors || []).map((v) => (
              <button
                key={v.id}
                onClick={() => setVendorId(v.id)}
                style={{
                  padding: '0.85rem 1rem', borderRadius: 'var(--radius-lg)',
                  border: vendorId === v.id ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: vendorId === v.id ? 'var(--brand-soft)' : 'var(--surface)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>🏪 {v.shopName} {vendorId === v.id ? '✓' : ''}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                  {typeof v.averageRating === 'number' && v.averageRating > 0 ? `⭐ ${v.averageRating}` : 'Mshonaji mpya'}
                  {v.description ? ` · ${v.description.slice(0, 60)}` : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose fabric + style */}
      {step === 2 && (
        <div>
          <SectionTitle title="Kitambaa" emoji="🧵" />
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {FABRICS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFabric(f.id)}
                style={{
                  padding: '0.85rem', borderRadius: 'var(--radius-lg)', border: fabric === f.id ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: fabric === f.id ? 'var(--brand-soft)' : 'var(--surface)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.3rem', marginRight: '0.4rem' }}>{f.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{f.name}</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{f.desc}</div>
              </button>
            ))}
          </div>

          <SectionTitle title="Aina ya muundo" emoji="✂️" />
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                style={{
                  padding: '0.85rem', borderRadius: 'var(--radius-lg)', border: style === s.id ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: style === s.id ? 'var(--brand-soft)' : 'var(--surface)', cursor: 'pointer', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.emoji}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{s.name}</div>
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            disabled={!canProceed()}
            onClick={() => setStep(3)}
            style={{ marginTop: '1.5rem', width: '100%' }}
          >
            Endelea →
          </button>
        </div>
      )}

      {/* Step 3: Measurements */}
      {step === 3 && (
        <div>
          <SectionTitle title="Vipimo vyako" emoji="📏" />
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Weka vipimo au tuma sauti/picha kwa mshonaji
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { key: 'chest', label: 'Kifua (Chest)', placeholder: 'cm' },
              { key: 'waist', label: 'Uso (Waist)', placeholder: 'cm' },
              { key: 'hips', label: 'Viti (Hips)', placeholder: 'cm' },
              { key: 'shoulders', label: 'Mabega (Shoulders)', placeholder: 'cm' },
              { key: 'length', label: 'Urefu (Length)', placeholder: 'cm' },
              { key: 'sleeves', label: 'Mikono (Sleeves)', placeholder: 'cm' },
            ].map((field) => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>{field.label}</label>
                <input
                  type="number"
                  placeholder={field.placeholder}
                  value={(measurements as any)[field.key]}
                  onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}
                />
              </div>
            ))}
          </div>

          {/* Voice note */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>🎤 Sauti (Voice Note)</label>
            <input
              type="file"
              accept="audio/*"
              capture="user"
              onChange={(e) => setVoiceNote(e.target.files?.[0] || null)}
              style={{ fontSize: '0.85rem' }}
            />
            {voiceNote && <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: '0.5rem' }}>✓ Imewekwa</span>}
          </div>

          {/* Photo */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>📸 Picha ya mfano / nguo</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              style={{ fontSize: '0.85rem' }}
            />
            {photo && <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: '0.5rem' }}>✓ Imewekwa</span>}
          </div>

          {/* Extra notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Maelezo ya ziada</label>
            <textarea
              placeholder="Maelezo mengine kwa mshonaji..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', resize: 'vertical' }}
            />
          </div>

          {orderError && (
            <div style={{ border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius)', padding: '0.7rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
              ⚠️ {orderError}
            </div>
          )}
          {!vendorId && (
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              ℹ️ Rudi Hatua ya 1 kuchagua mshonaji kabla ya kutuma oda.
            </p>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !vendorId}
            style={{ width: '100%' }}
          >
            {submitting ? 'Inatuma...' : 'Tuma Oda →'}
          </button>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✂️</div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Oda Imetumwa!</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Mshonaji atakupigia ili kuthibitisha vipimo na bei
          </p>
          {placedOrder?.orderId && (
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Namba ya oda: <strong>{placedOrder.orderId.slice(0, 8).toUpperCase()}</strong>
              {placedOrder.otpCode ? ` · Kodi ya kufikisha: ${placedOrder.otpCode}` : ''}
            </p>
          )}
          <p style={{ marginBottom: '1.5rem' }}>
            <button className="btn" onClick={() => navigate('/orders')} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
              Angalia Oda Zangu
            </button>
          </p>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Aina:</div>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{SUBCATEGORIES.find((s) => s.id === subcat)?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Kitambaa:</div>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{FABRICS.find((f) => f.id === fabric)?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Muundo:</div>
            <div style={{ fontWeight: 700 }}>{STYLES.find((s) => s.id === style)?.name}</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: '100%' }}>
            Rudisha Nyumbani
          </button>
        </div>
      )}
    </div>
  );
}
