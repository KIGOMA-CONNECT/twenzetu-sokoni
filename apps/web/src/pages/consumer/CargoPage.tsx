import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDevice } from '../../hooks/useDevice';
import { SectionTitle } from '../../components/ui';
import { MapPicker, calculateDistance, VEHICLE_RATES, type VehicleRate } from '../../components/MapPicker';
import api from '../../api/client';

const CARGO_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000090', name: 'Cargo ya Ndani', emoji: '📦', key: 'domestic' },
  { id: 'd0000000-0000-0000-0000-000000000091', name: 'Express Delivery', emoji: '⚡', key: 'express' },
  { id: 'd0000000-0000-0000-0000-000000000092', name: 'Logistics ya Biashara', emoji: '🏢', key: 'business' },
  { id: 'd0000000-0000-0000-0000-000000000093', name: 'Kukodisha Lori/Cherehe', emoji: '🚛', key: 'rental' },
];

const PAYMENT_METHODS: Array<{ id: string; icon: string; nameKey: string; descKey: string }> = [
  { id: 'wallet', icon: '💰', nameKey: 'wallet', descKey: 'walletDesc' },
  { id: 'mpesa', icon: '📱', nameKey: 'mpesa', descKey: 'mpesaDesc' },
  { id: 'tigo_money', icon: '📱', nameKey: 'tigoMoney', descKey: 'tigoMoneyDesc' },
  { id: 'airtel_money', icon: '📱', nameKey: 'airtelMoney', descKey: 'airtelMoneyDesc' },
  { id: 'halotel', icon: '📱', nameKey: 'halotel', descKey: 'halotelDesc' },
  { id: 'azampesa', icon: '📱', nameKey: 'azamPay', descKey: 'azamPayDesc' },
  { id: 'card', icon: '💳', nameKey: 'card', descKey: 'cardDesc' },
  { id: 'cash', icon: '💵', nameKey: 'cash', descKey: 'cashDesc' },
];

function cargoPayMethodName(id: string): string {
  const m = PAYMENT_METHODS.find((x) => x.id === id);
  return m ? m.nameKey : '';
}

interface BookingResult {
  success: boolean;
  requestId: string;
  orderId: string;
  fare: number;
  distanceKm: number;
  vehicle: string;
  capacityKg: number;
  paymentMethod: string;
  paymentStatus: string;
  checkoutUrl?: string;
  message?: string;
  fareBreakdown?: Array<{ label: string; amount: number }>;
}

export default function CargoPage() {
  const navigate = useNavigate();
  const device = useDevice();
  const isPhone = device.type === 'phone';
  const { t } = useTranslation();
  const c = 'cargo.';

  const [selectedSub, setSelectedSub] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [pickup, setPickup] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [delivery, setDelivery] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [tripType, setTripType] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledAt, setScheduledAt] = useState('');
  const [insured, setInsured] = useState(false);
  const [cargoValue, setCargoValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<BookingResult | null>(null);

  const [serverFare, setServerFare] = useState<{ totalFare: number; breakdown: Array<{ label: string; amount: number }> } | null>(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [fareError, setFareError] = useState('');

  const selectedVehicle = VEHICLE_RATES.find((v) => v.id === vehicleId) as VehicleRate | undefined;

  const distance = useMemo(() => {
    if (!pickup || !delivery) return 0;
    return calculateDistance(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
  }, [pickup, delivery]);

  const weightKg = parseFloat(weight) || 0;
  const cargoValueNum = parseFloat(cargoValue) || 0;
  const overCapacity = selectedVehicle ? weightKg > selectedVehicle.capacityKg : false;

  // Live binding quote straight from the server (single source of truth for pricing)
  useEffect(() => {
    if (!pickup || !delivery || !selectedVehicle || weightKg < 0 || weightKg > (selectedVehicle?.capacityKg ?? Infinity)) {
      setServerFare(null);
      return;
    }
    setFareLoading(true);
    setFareError('');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/public/cargo/fare', {
          params: {
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            dropLat: delivery.lat,
            dropLng: delivery.lng,
            vehicle: selectedVehicle.id,
            weightKg,
            tripType,
            cargoValue: cargoValueNum || undefined,
            insured: insured ? 'true' : 'false',
          },
        });
        const data = res.data.data;
        setServerFare({ totalFare: data.totalFare, breakdown: data.breakdown });
      } catch (err: any) {
        setFareError(err.response?.data?.message || err.response?.data?.error || t('cargo.fareUnavailable'));
        setServerFare(null);
      } finally {
        setFareLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [pickup, delivery, selectedVehicle, weightKg, cargoValueNum, tripType, insured]);

  const bindingFare = serverFare?.totalFare ?? 0;
  const previewFare = useMemo(() => {
    if (!selectedVehicle) return 0;
    return (() => {
      const d = Math.max(0.5, Math.round(distance * 100) / 100);
      const subtotal = Math.max(selectedVehicle.baseFare + (d * selectedVehicle.perKm) + (weightKg * selectedVehicle.perKg), selectedVehicle.minFare);
      const ins = insured && cargoValueNum > 0 ? Math.max(500, Math.round(cargoValueNum * 0.005)) : 0;
      const disc = tripType === 'scheduled' ? Math.round(subtotal * 0.1) : 0;
      return Math.max(subtotal - disc, Math.round(selectedVehicle.minFare * 0.9)) + ins;
    })();
  }, [distance, weightKg, selectedVehicle, tripType, insured, cargoValueNum]);

  const displayFare = bindingFare || previewFare;

  function formatCurrency(amount: number): string {
    return 'Tsh ' + amount.toLocaleString('sw-TZ');
  }

  const selectedSubObj = CARGO_SUBS.find((s) => s.id === selectedSub);
  const canBook = Boolean(pickup && delivery && selectedSubObj && selectedVehicle && weightKg > 0 && !overCapacity && displayFare > 0);

  async function submitBooking() {
    if (!pickup || !delivery || !selectedSubObj || !selectedVehicle) return;
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post('/cargo/requests', {
        subServiceName: selectedSubObj.name,
        vehicle: selectedVehicle.id,
        pickup: { address: pickup.address, lat: pickup.lat, lng: pickup.lng },
        delivery: { address: delivery.address, lat: delivery.lat, lng: delivery.lng },
        weightKg,
        tripType,
        scheduledAt: tripType === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        insured,
        cargoValue: insured ? cargoValueNum : undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      const data: BookingResult = res.data.data;
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setResult(data);
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t('cargo.requestError')
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedSub('');
    setVehicleId('');
    setPickup(null);
    setDelivery(null);
    setWeight('');
    setNotes('');
    setTripType('instant');
    setScheduledAt('');
    setInsured(false);
    setCargoValue('');
    setPaymentMethod('wallet');
    setSubmitError('');
    setServerFare(null);
    setResult(null);
  }

  if (result) {
    const paid = result.success;
    return (
      <div className="page" style={{ paddingTop: device.safeAreaInsets.top || undefined, paddingBottom: '3rem' }}>
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{paid ? '✅' : '⏳'}</div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>
            {paid ? t(c + 'transportConfirmed') : t(c + 'requestRegistered')}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {result.message}
          </p>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
            padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left', maxWidth: 420, margin: '0 auto 1.5rem',
          }}>
            {result.fareBreakdown?.map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--muted)' }}>{b.label}</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(b.amount)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--line)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800 }}>{t(c + 'total')}</span>
              <span style={{ fontWeight: 800, color: 'var(--brand)' }}>{formatCurrency(result.fare)}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.6rem' }}>
              {result.vehicle} · {result.distanceKm.toFixed(1)} km · {t(c + 'requestNumber')} {result.requestId.slice(0, 8)}...
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={resetForm}
            style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}
          >
            {t(c + 'newRequest')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: device.safeAreaInsets.top || undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>←</button>
        <div>
          <h1 style={{ fontSize: isPhone ? '1.2rem' : '1.5rem', fontWeight: 800 }}>🚚 {t(c + 'title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t(c + 'subtitle')}</p>
        </div>
      </div>

      {/* Connect.com banner */}
      <div style={{
        background: 'linear-gradient(120deg, #059669, #10b981)', borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem', marginBottom: '1.5rem', color: '#fff',
      }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>🌐 {t(c + 'connect')}</div>
        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{t(c + 'connectDesc')}</div>
      </div>

      {/* Service type */}
      <SectionTitle title={t(c + 'serviceType')} emoji="📦" />
      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {CARGO_SUBS.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSelectedSub(sub.id)}
            style={{
              padding: '0.85rem', borderRadius: 'var(--radius-lg)',
              border: selectedSub === sub.id ? '2px solid var(--brand)' : '1px solid var(--line)',
              background: selectedSub === sub.id ? 'var(--brand-soft)' : 'var(--surface)',
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{sub.emoji}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{t(`cargo.zones.${sub.key}`)}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{t(`cargo.zones.${sub.key}Desc`)}</div>
          </button>
        ))}
      </div>

      {/* Vehicle type */}
      {selectedSub && (
        <>
          <SectionTitle title={t(c + 'vehicleType')} emoji="🚗" />
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {VEHICLE_RATES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVehicleId(v.id)}
                style={{
                  padding: '0.85rem', borderRadius: 'var(--radius-lg)',
                  border: vehicleId === v.id ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: vehicleId === v.id ? 'var(--brand-soft)' : 'var(--surface)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.3rem', marginRight: '0.4rem' }}>{v.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{v.name}</span>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                  {v.capacity} · {formatCurrency(v.baseFare)}+
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Maps & Address */}
      {vehicleId && (
        <>
          <SectionTitle title={t(c + 'pickupLocation')} emoji="📍" />
          <MapPicker
            onSelect={setPickup}
            initialLat={-6.7924}
            initialLng={39.2083}
            placeholder={t(c + 'pickupPlaceholder')}
            style={{ marginBottom: '1.5rem' }}
          />

          <SectionTitle title={t(c + 'deliveryLocation')} emoji="📍" />
          <MapPicker
            onSelect={setDelivery}
            initialLat={pickup ? pickup.lat : -6.7924}
            initialLng={pickup ? pickup.lng : 39.2083}
            placeholder={t(c + 'deliveryPlaceholder')}
            style={{ marginBottom: '1.5rem' }}
          />

          {/* Trip type */}
          <SectionTitle title={t(c + 'tripPlan')} emoji="🕐" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setTripType('instant')}
              style={{
                padding: '0.85rem', borderRadius: 'var(--radius-lg)',
                border: tripType === 'instant' ? '2px solid var(--brand)' : '1px solid var(--line)',
                background: tripType === 'instant' ? 'var(--brand-soft)' : 'var(--surface)',
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem' }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t(c + 'instant')}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{t(c + 'instantDesc')}</div>
            </button>
            <button
              onClick={() => setTripType('scheduled')}
              style={{
                padding: '0.85rem', borderRadius: 'var(--radius-lg)',
                border: tripType === 'scheduled' ? '2px solid var(--brand)' : '1px solid var(--line)',
                background: tripType === 'scheduled' ? 'var(--brand-soft)' : 'var(--surface)',
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem' }}>📅</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t(c + 'scheduled')}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{t(c + 'scheduledDesc')}</div>
            </button>
          </div>
          {tripType === 'scheduled' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>{t(c + 'pickupTime')}</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}
              />
            </div>
          )}

          {/* Weight & extras */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              ⚖️ {t(c + 'weight')} {selectedVehicle && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>— {t(c + 'weightUpTo')} {selectedVehicle.capacityKg} kg</span>}
            </label>
            <input
              type="number"
              min="0"
              placeholder="kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: `1px solid ${overCapacity ? '#fca5a5' : 'var(--line)'}` }}
            />
            {overCapacity && selectedVehicle && (
              <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '0.3rem' }}>
                {t(c + 'capacityExceeded')} {selectedVehicle.name} ({selectedVehicle.capacityKg} kg). {t(c + 'chooseLargerVehicle')}
              </div>
            )}
          </div>

          {/* Insurance */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.4rem' }}>
              <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>🛡️ {t(c + 'cargoInsurance')} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t(c + 'cargoInsuranceNote')}</span></span>
            </label>
            {insured && (
              <input
                type="number"
                min="0"
                placeholder={t(c + 'cargoValuePlaceholder')}
                value={cargoValue}
                onChange={(e) => setCargoValue(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}
              />
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>{t(c + 'cargoDescription')}</label>
            <textarea
              placeholder={t(c + 'cargoDescriptionPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', resize: 'vertical' }}
            />
          </div>

          {/* Payment method */}
          <SectionTitle title={t(c + 'paymentMethod')} emoji="💳" />
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                style={{
                  padding: '0.75rem', borderRadius: 'var(--radius-lg)',
                  border: paymentMethod === m.id ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: paymentMethod === m.id ? 'var(--brand-soft)' : 'var(--surface)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.2rem', marginRight: '0.4rem' }}>{m.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{t(c + m.nameKey)}</span>
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{t(c + m.descKey)}</div>
              </button>
            ))}
          </div>

          {/* Fare Summary (live server quote) */}
          {pickup && delivery && selectedVehicle && displayFare > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: 'var(--radius-lg)',
              padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #bbf7d0',
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.75rem', color: '#166534' }}>
                💰 {fareLoading ? t(c + 'calculatingFare') : t(c + 'lockedFare')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>{t(c + 'summaryDistance')}</span>
                <span style={{ fontWeight: 700 }}>{distance.toFixed(1)} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>{t(c + 'summaryWeight')}</span>
                <span style={{ fontWeight: 700 }}>{weightKg} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>{t(c + 'summaryVehicle')}</span>
                <span style={{ fontWeight: 700 }}>{selectedVehicle.emoji} {selectedVehicle.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>{t(c + 'summaryPlan')}</span>
                <span style={{ fontWeight: 700 }}>{tripType === 'scheduled' ? `📅 ${t(c + 'summaryPlanScheduled')}` : `⚡ ${t(c + 'summaryPlanInstant')}`}</span>
              </div>
              {serverFare?.breakdown?.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{b.label}</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(b.amount)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #bbf7d0', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>{t(c + 'totalLabel')}</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#166534' }}>{formatCurrency(displayFare)}</span>
              </div>
              {!serverFare && !fareLoading && (
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                  {t(c + 'estimateNote')}
                </div>
              )}
            </div>
          )}

          {fareError && (
            <div style={{
              background: 'var(--danger-soft)', border: '1px solid #fecaca', color: '#b91c1c',
              borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem',
            }}>
              {fareError}
            </div>
          )}

          {submitError && (
            <div style={{
              background: 'var(--danger-soft)', border: '1px solid #fecaca', color: '#b91c1c',
              borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem',
            }}>
              {submitError}
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={!canBook || submitting}
            onClick={submitBooking}
            style={{ width: '100%', fontSize: '1rem', padding: '0.85rem' }}
          >
            {submitting
              ? t(c + 'inProgress')
              : !canBook
                ? `🚚 ${t(c + 'fillAllDetails')}`
                : `🚚 ${t(c + 'requestRide')} — ${formatCurrency(displayFare)}${paymentMethod === 'wallet' ? '' : ` · ${t(c + cargoPayMethodName(paymentMethod))}`}`}
          </button>
        </>
      )}
    </div>
  );
}
