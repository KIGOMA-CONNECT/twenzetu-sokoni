import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '../../hooks/useDevice';
import { SectionTitle } from '../../components/ui';
import { MapPicker, calculateDistance, calculateFare, VEHICLE_RATES } from '../../components/MapPicker';

const CARGO_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000090', name: 'Cargo ya Ndani', emoji: '📦', desc: 'Kutoka mji hadi mji' },
  { id: 'd0000000-0000-0000-0000-000000000091', name: 'Express Delivery', emoji: '⚡', desc: 'Saa 1-2 ndani ya mji' },
  { id: 'd0000000-0000-0000-0000-000000000092', name: 'Logistics ya Biashara', emoji: '🏢', desc: 'Bulk, kampuni, warehouse' },
  { id: 'd0000000-0000-0000-0000-000000000093', name: 'Kukodisha Lori/Cherehe', emoji: '🚛', desc: 'Mizigo mikubwa' },
];

export default function CargoPage() {
  const navigate = useNavigate();
  const device = useDevice();
  const [selectedSub, setSelectedSub] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [pickup, setPickup] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [delivery, setDelivery] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const isPhone = device.type === 'phone';

  const selectedVehicle = VEHICLE_RATES.find((v) => v.id === vehicleId);

  const distance = useMemo(() => {
    if (!pickup || !delivery) return 0;
    return calculateDistance(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
  }, [pickup, delivery]);

  const weightKg = parseFloat(weight) || 0;

  const fare = useMemo(() => {
    if (!selectedVehicle || !pickup || !delivery) return 0;
    return calculateFare(distance, weightKg, selectedVehicle);
  }, [distance, weightKg, selectedVehicle, pickup, delivery]);

  function formatCurrency(amount: number): string {
    return 'Tsh ' + amount.toLocaleString('sw-TZ');
  }

  return (
    <div className="page" style={{ paddingTop: device.safeAreaInsets.top || undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>←</button>
        <div>
          <h1 style={{ fontSize: isPhone ? '1.2rem' : '1.5rem', fontWeight: 800 }}>🚚 Cargo, Express & Logistics</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Tuma mzigo wako kwa usalama</p>
        </div>
      </div>

      {/* Connect.com banner */}
      <div style={{
        background: 'linear-gradient(120deg, #059669, #10b981)', borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem', marginBottom: '1.5rem', color: '#fff',
      }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>🌐 afriMarket Connect</div>
        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Pia unaweza kutumia Connect.com kwa usafiri wa biashara yako</div>
      </div>

      {/* Service type */}
      <SectionTitle title="Aina ya huduma" emoji="📦" />
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
            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{sub.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{sub.desc}</div>
          </button>
        ))}
      </div>

      {/* Vehicle type */}
      {selectedSub && (
        <>
          <SectionTitle title="Aina ya usafiri" emoji="🚗" />
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
          {/* Pickup Map */}
          <SectionTitle title="📍 Mahali pa kuchukua mzigo" emoji="" />
          <MapPicker
            onSelect={setPickup}
            initialLat={-6.7924}
            initialLng={39.2083}
            placeholder="Tafuta eneo la pickup..."
            style={{ marginBottom: '1.5rem' }}
          />

          {/* Delivery Map */}
          <SectionTitle title="📍 Mahali pa kuelekeza mzigo" emoji="" />
          <MapPicker
            onSelect={setDelivery}
            initialLat={pickup ? pickup.lat : -6.7924}
            initialLng={pickup ? pickup.lng : 39.2083}
            placeholder="Tafuta eneo la delivery..."
            style={{ marginBottom: '1.5rem' }}
          />

          {/* Weight & Notes */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>⚖️ Uzito (kg)</label>
            <input
              type="number"
              placeholder="kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Maelezo ya mzigo</label>
            <textarea
              placeholder="Eleza mzigo wako..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', resize: 'vertical' }}
            />
          </div>

          {/* Fare Summary */}
          {pickup && delivery && selectedVehicle && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderRadius: 'var(--radius-lg)',
              padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #bbf7d0',
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.75rem', color: '#166534' }}>
                💰 Umakini wa Nauli
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Umbali:</span>
                <span style={{ fontWeight: 700 }}>{distance.toFixed(1)} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Uzito:</span>
                <span style={{ fontWeight: 700 }}>{weightKg} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Usafiri:</span>
                <span style={{ fontWeight: 700 }}>{selectedVehicle.emoji} {selectedVehicle.name}</span>
              </div>
              <div style={{ borderTop: '1px solid #bbf7d0', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>Jumla ya Nauli:</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#166534' }}>{formatCurrency(fare)}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                Base: {formatCurrency(selectedVehicle.baseFare)} + Umbali: {formatCurrency(distance * selectedVehicle.perKm)} + Uzito: {formatCurrency(weightKg * selectedVehicle.perKg)}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={!pickup || !delivery || !weight}
            style={{ width: '100%', fontSize: '1rem', padding: '0.85rem' }}
          >
            🚚 Omba Usafiri — {fare > 0 ? formatCurrency(fare) : 'Chagua eneo'}
          </button>
        </>
      )}
    </div>
  );
}
