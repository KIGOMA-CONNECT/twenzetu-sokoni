import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import type { Address } from '../../types';

interface AddressForm {
  label: string;
  country: string;
  region: string;
  city: string;
  district: string;
  street: string;
  landmark: string;
  postalCode: string;
  notes: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  label: 'Home',
  country: 'TZ',
  region: '',
  city: '',
  district: '',
  street: '',
  landmark: '',
  postalCode: '',
  notes: '',
  isDefault: false,
};

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'TZ', name: 'Tanzania' },
  { code: 'KE', name: 'Kenya' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'UG', name: 'Uganda' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'EG', name: 'Egypt' },
];

function composeFullAddress(f: AddressForm): string {
  const parts = [f.street, f.landmark ? `near ${f.landmark}` : '', f.district, f.city, f.region];
  const address = parts.filter(Boolean).join(', ');
  if (!address) return f.notes || '';
  return f.postalCode ? `${address}, ${f.postalCode}` : address;
}

export default function AddressPage() {
  const { data: addresses, loading, error, refetch } = useApi<Address[]>('/addresses/me');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const openModal = () => {
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const updateField = <K extends keyof AddressForm>(field: K, value: AddressForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const locateMe = () => {
    setLocating(true);
    setFormError(null);
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported on this device.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((prev) => ({ ...prev, latitude, longitude }));
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          }
        }
        setLocating(false);
      },
      (err) => {
        setFormError(`Could not get your location (${err.message}). Please pin it on the map instead.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (!modalOpen) return;
    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [modalOpen]);

  const onMapReady = (el: HTMLDivElement | null) => {
    if (!el || mapRef.current) return;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    const defaultPos: [number, number] = [-6.7924, 39.2083];
    const map = L.map(el, { attributionControl: true }).setView(defaultPos, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;

    const marker = L.marker(defaultPos, { draggable: true }).addTo(map);
    markerRef.current = marker;

    const sync = (latlng: L.LatLng) => {
      setForm((prev) => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
    };
    marker.on('dragend', () => {
      if (markerRef.current) sync(markerRef.current.getLatLng());
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
        sync(e.latlng);
      }
    });
    setTimeout(() => map.invalidateSize(), 150);
  };

  const submitAddress = async () => {
    const label = form.label.trim();
    const fullAddress = composeFullAddress(form);
    if (!label) {
      setFormError('Label is required.');
      return;
    }
    if (!form.city && !form.street && !form.landmark && !form.notes) {
      setFormError('Please add at least a city, street, landmark or notes for the address.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/addresses', {
        label,
        fullAddress,
        latitude: form.latitude ?? 0,
        longitude: form.longitude ?? 0,
        isDefault: form.isDefault,
        country: form.country || 'TZ',
        region: form.region.trim() || undefined,
        city: form.city.trim() || undefined,
        district: form.district.trim() || undefined,
        street: form.street.trim() || undefined,
        landmark: form.landmark.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        notes: form.notes.trim() || undefined,
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

  const setDefault = async (address: Address) => {
    try {
      await api.patch(`/addresses/${address.id}/default`);
      await refetch();
    } catch {
      alert('Failed to set default address.');
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
                <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>{addr.fullAddress}</p>
                {(addr.region || addr.city || addr.district) && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>
                    {[addr.district, addr.city, addr.region].filter(Boolean).join(' · ')}
                    {addr.postalCode ? ` · ${addr.postalCode}` : ''}
                  </p>
                )}
                {addr.latitude != null && addr.longitude != null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${addr.latitude}&mlon=${addr.longitude}#map=16/${addr.latitude}/${addr.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.78rem', color: 'var(--brand)', fontWeight: 700, display: 'inline-block', marginBottom: '0.75rem' }}
                  >
                    Open in map ↗
                  </a>
                )}
                <div className="flex gap-1 wrap">
                  {!addr.isDefault && (
                    <button className="btn btn-outline btn-sm" onClick={() => setDefault(addr)}>Set default</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(addr)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-title">📍 Add Address</div>

            <div className="grid grid-2 responsive-grid-2col">
              <div className="field">
                <label className="field-label">Label</label>
                <select className="select" value={form.label} onChange={(e) => updateField('label', e.target.value)}>
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Country</label>
                <select className="select" value={form.country} onChange={(e) => updateField('country', e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Region / Province</label>
                <input className="input" placeholder="e.g. Dar es Salaam" value={form.region} onChange={(e) => updateField('region', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">City</label>
                <input className="input" placeholder="e.g. Dar es Salaam" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">District</label>
                <input className="input" placeholder="e.g. Kinondoni" value={form.district} onChange={(e) => updateField('district', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Street / Area</label>
                <input className="input" placeholder="e.g. Msasani, Haile Selassie Rd" value={form.street} onChange={(e) => updateField('street', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Landmark</label>
                <input className="input" placeholder="e.g. Near Mlimani City" value={form.landmark} onChange={(e) => updateField('landmark', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Postal Code</label>
                <input className="input" placeholder="e.g. 14112" value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Notes / Directions</label>
              <input className="input" placeholder="e.g. Blue gate, 2nd house after the shop" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label">Pin your location on the map</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button className="btn btn-outline btn-sm" onClick={locateMe} disabled={locating}>
                  {locating ? 'Locating...' : '📡 Use my current location'}
                </button>
                {form.latitude != null && form.longitude != null && (
                  <span className="badge badge-brand" style={{ alignSelf: 'center' }}>
                    {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                  </span>
                )}
              </div>
              <div ref={onMapReady} style={{ height: 220, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--line)' }} />
              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                Click on the map to drop a pin, or drag the marker to refine. Drivers use this to find you.
              </div>
            </div>

            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isDefault} onChange={(e) => updateField('isDefault', e.target.checked)} style={{ accentColor: 'var(--brand)' }} />
              Set as default delivery address
            </label>

            {composeFullAddress(form) && (
              <div className="alert alert-info mt-1" style={{ fontSize: '0.85rem' }}>
                <strong>Preview:</strong> {composeFullAddress(form)}
              </div>
            )}

            {formError && <div className="alert alert-error mb-1">⚠️ {formError}</div>}

            <div className="flex justify-between gap-2" style={{ justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAddress} disabled={saving}>
                {saving ? 'Saving…' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
