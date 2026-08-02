import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DeliveryMapProps {
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  driverLat?: number;
  driverLng?: number;
  pickupLabel?: string;
  deliveryLabel?: string;
  height?: number;
}

export default function DeliveryMap({
  pickupLat,
  pickupLng,
  deliveryLat,
  deliveryLng,
  driverLat,
  driverLng,
  pickupLabel = 'Pickup',
  deliveryLabel = 'Customer',
  height = 260,
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any | null>(null);
  const markersRef = useRef<{ pickup?: any; delivery?: any; driver?: any }>({});

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    leafletMapRef.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([-6.8, 39.2], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(leafletMapRef.current);
    setTimeout(() => leafletMapRef.current?.invalidateSize(), 200);
    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;
    const m = markersRef.current;

    if (pickupLat && pickupLng) {
      if (m.pickup) m.pickup.setLatLng([pickupLat, pickupLng]);
      else m.pickup = L.marker([pickupLat, pickupLng], {
        icon: L.divIcon({ className: '', html: '🏪', iconSize: [26, 26], iconAnchor: [13, 26] }),
      }).addTo(map).bindPopup(pickupLabel);
    }

    if (deliveryLat && deliveryLng) {
      if (m.delivery) m.delivery.setLatLng([deliveryLat, deliveryLng]);
      else m.delivery = L.marker([deliveryLat, deliveryLng], {
        icon: L.divIcon({ className: '', html: '📍', iconSize: [24, 24], iconAnchor: [12, 24] }),
      }).addTo(map).bindPopup(deliveryLabel);
    }

    if (driverLat && driverLng) {
      if (m.driver) m.driver.setLatLng([driverLat, driverLng]);
      else m.driver = L.marker([driverLat, driverLng], {
        icon: L.divIcon({ className: '', html: '🛵', iconSize: [24, 24], iconAnchor: [12, 12] }),
      }).addTo(map).bindPopup('You');
    }

    const points: [number, number][] = [];
    if (pickupLat && pickupLng) points.push([pickupLat, pickupLng]);
    if (deliveryLat && deliveryLng) points.push([deliveryLat, deliveryLng]);
    if (driverLat && driverLng) points.push([driverLat, driverLng]);

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [pickupLat, pickupLng, deliveryLat, deliveryLng, driverLat, driverLng, pickupLabel, deliveryLabel]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height, borderRadius: 10, border: '1px solid #e2e8f0', zIndex: 0 }}
    />
  );
}
