import { useEffect, useRef, useState, useCallback } from 'react';

interface MapPickerProps {
  onSelect: (location: { address: string; lat: number; lng: number }) => void;
  initialLat?: number;
  initialLng?: number;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function MapPicker({ onSelect, initialLat = -6.7924, initialLng = 39.2083, placeholder = 'Tafuta anwani...', style }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => map.invalidateSize(), 100);
    });
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'afriMarket/1.0' },
      });
      const data = await res.json();
      const addr = data.display_name || `${lat}, ${lng}`;
      setSelectedAddress(addr);
      onSelect({ address: addr, lat, lng });
    } catch {
      setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      onSelect({ address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng });
    }
  }, [onSelect]);

  const searchLocation = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
        headers: { 'User-Agent': 'afriMarket/1.0' },
      });
      const data = await res.json();
      setResults(data);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const selectResult = useCallback((r: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
    setSelectedAddress(r.display_name);
    setQuery(r.display_name.split(',')[0]);
    setShowResults(false);
    onSelect({ address: r.display_name, lat, lng });
  }, [onSelect]);

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
          placeholder={placeholder}
          style={{ flex: 1, padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', fontSize: '0.85rem' }}
        />
        <button className="btn btn-primary" onClick={searchLocation} style={{ padding: '0.65rem 1rem' }}>
          {loading ? '...' : '🔍'}
        </button>
      </div>

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 44, left: 0, right: 0, zIndex: 1000,
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)', maxHeight: 200, overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => selectResult(r)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem',
                border: 'none', borderBottom: '1px solid var(--line)', background: 'none',
                cursor: 'pointer', fontSize: '0.8rem', color: 'var(--ink)',
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Selected address display */}
      {selectedAddress && (
        <div style={{ fontSize: '0.78rem', color: 'var(--brand)', marginBottom: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--brand-soft)', borderRadius: 'var(--radius)' }}>
          📍 {selectedAddress.length > 80 ? selectedAddress.substring(0, 80) + '...' : selectedAddress}
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ width: '100%', height: 250, borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}
      />
    </div>
  );
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface VehicleRate {
  id: string;
  name: string;
  emoji: string;
  capacity: string;
  baseFare: number;
  perKm: number;
  perKg: number;
  minFare: number;
}

export const VEHICLE_RATES: VehicleRate[] = [
  { id: 'bodaboda', name: 'Bodaboda', emoji: '🏍️', capacity: '5kg', baseFare: 2000, perKm: 500, perKg: 200, minFare: 2000 },
  { id: 'tukutuku', name: 'TukTuk', emoji: '🛺', capacity: '20kg', baseFare: 3000, perKm: 800, perKg: 150, minFare: 5000 },
  { id: 'pickup', name: 'Pickup', emoji: '🛻', capacity: '500kg', baseFare: 10000, perKm: 2000, perKg: 50, minFare: 20000 },
  { id: 'van', name: 'Van', emoji: '🚐', capacity: '100kg', baseFare: 5000, perKm: 1200, perKg: 80, minFare: 10000 },
  { id: 'lorry', name: 'Lori', emoji: '🚛', capacity: '5-10 tons', baseFare: 50000, perKm: 5000, perKg: 10, minFare: 100000 },
];

export function calculateFare(distanceKm: number, weightKg: number, vehicle: VehicleRate): number {
  const fare = vehicle.baseFare + (distanceKm * vehicle.perKm) + (weightKg * vehicle.perKg);
  return Math.max(fare, vehicle.minFare);
}
