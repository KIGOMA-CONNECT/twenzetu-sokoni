import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '../../hooks/useDevice';
import { SectionTitle } from '../../components/ui';

const CARGO_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000090', name: 'Cargo ya Ndani', emoji: '📦', desc: 'Kutoka mji hadi mji' },
  { id: 'd0000000-0000-0000-0000-000000000091', name: 'Express Delivery', emoji: '⚡', desc: 'Saa 1-2 ndani ya mji' },
  { id: 'd0000000-0000-0000-0000-000000000092', name: 'Logistics ya Biashara', emoji: '🏢', desc: 'Bulk, kampuni, warehouse' },
  { id: 'd0000000-0000-0000-0000-000000000093', name: 'Kukodisha Lori/Cherehe', emoji: '🚛', desc: 'Mizigo mikubwa' },
];

const VEHICLE_TYPES = [
  { id: 'bodaboda', name: 'Bodaboda', emoji: '🏍️', capacity: '5kg', price: 'Tsh 2,000-5,000' },
  { id: 'tukutuku', name: 'TukTuk', emoji: '🛺', capacity: '20kg', price: 'Tsh 5,000-10,000' },
  { id: 'pickup', name: 'Pickup', emoji: '🛻', capacity: '500kg', price: 'Tsh 20,000-50,000' },
  { id: 'lorry', name: 'Lori', emoji: '🚛', capacity: '5-10 tons', price: 'Tsh 100,000-300,000' },
  { id: 'van', name: 'Van', emoji: '🚐', capacity: '100kg', price: 'Tsh 10,000-25,000' },
];

export default function CargoPage() {
  const navigate = useNavigate();
  const device = useDevice();
  const [selectedSub, setSelectedSub] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const isPhone = device.type === 'phone';

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
            {VEHICLE_TYPES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVehicle(v.id)}
                style={{
                  padding: '0.85rem', borderRadius: 'var(--radius-lg)',
                  border: vehicle === v.id ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: vehicle === v.id ? 'var(--brand-soft)' : 'var(--surface)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.3rem', marginRight: '0.4rem' }}>{v.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{v.name}</span>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                  {v.capacity} · {v.price}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Pickup & Delivery */}
      {vehicle && (
        <>
          <SectionTitle title="Anwani" emoji="📍" />
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>📍 Pickup Location</label>
            <input
              type="text"
              placeholder="Mahali pa kuchukua mzigo..."
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>📍 Delivery Location</label>
            <input
              type="text"
              placeholder="Mahali pa kuelekeza mzigo..."
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}
            />
          </div>
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
          <button className="btn btn-primary" style={{ width: '100%' }}>
            🚚 Omba Usafiri
          </button>
        </>
      )}
    </div>
  );
}
