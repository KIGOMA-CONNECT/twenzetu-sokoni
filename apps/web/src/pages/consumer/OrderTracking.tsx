import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';
import api from '../../api/client';
import type { Order, TrackingInfo } from '../../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_STEPS = [
  'PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function getActiveStep(status: string): number {
  const idx = STATUS_STEPS.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: orderData, loading } = useApi<Order>(orderId ? `/orders/${orderId}` : null);
  const { data: trackingData, refetch: refetchTracking } = useApi<TrackingInfo>(
    orderId ? `/deliveries/order/${orderId}/tracking` : null,
  );
  const { connected, subscribe, trackOrder, untrackOrder } = useSocket();
  const [driverLat, setDriverLat] = useState<number | undefined>();
  const [driverLng, setDriverLng] = useState<number | undefined>();
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any | null>(null);
  const driverMarkerRef = useRef<any | null>(null);
  const deliveryMarkerRef = useRef<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orderData?.status) {
      setOrderStatus(orderData.status);
    }
  }, [orderData?.status]);

  useEffect(() => {
    if (trackingData) {
      setDriverLat(undefined);
      setDriverLng(undefined);
    }
  }, [trackingData?.deliveryId]);

  useEffect(() => {
    if (!orderId) return;
    trackOrder(orderId);
    return () => untrackOrder(orderId);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    api.get(`/messages/${orderId}`).then(res => {
      const payload = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(payload) ? payload : payload?.data;
      setMessages(Array.isArray(list) ? list : []);
    }).catch(() => setMessages([]));
  }, [orderId]);

  useEffect(() => {
    const unsub1 = subscribe('order-update', (data: any) => {
      if (data.orderStatus) {
        setOrderStatus(data.orderStatus);
        setLastUpdate(new Date().toLocaleTimeString());
      }
      if (data.type === 'driver-location') {
        setDriverLat(data.latitude);
        setDriverLng(data.longitude);
        setLastUpdate(new Date().toLocaleTimeString());
      }
      if (data.type === 'chat-message') {
        setMessages(prev => [...prev, data]);
        setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50);
      }
    });

    const unsub2 = subscribe('delivery-status-changed', (data: any) => {
      if (data.status === 'DELIVERED' || data.status === 'IN_TRANSIT') {
        setOrderStatus((data as any).orderStatus || orderStatus);
        refetchTracking();
      }
    });

    return () => { unsub1(); unsub2(); };
  }, [orderId, subscribe]);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || !orderId) return;
    try {
      const res = await api.post('/messages', { orderId, message: chatInput.trim() });
      const sent = res.data?.data || res.data;
      setMessages(prev => [...prev, Array.isArray(sent) ? sent[0] : sent]);
      setChatInput('');
      setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50);
    } catch { /* no-op */}
  }, [chatInput, orderId]);

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
  }, [trackingData?.deliveryId]);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const dlng = driverLng ?? trackingData?.currentLongitude;
    const dlat = driverLat ?? trackingData?.currentLatitude;
    const delLng = trackingData?.deliveryLongitude;
    const delLat = trackingData?.deliveryLatitude;

    if (dlat && dlng) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([dlat, dlng]);
      } else {
        driverMarkerRef.current = L.marker([dlat, dlng], {
          icon: L.divIcon({ className: '', html: '🛵', iconSize: [24, 24], iconAnchor: [12, 12] }),
        }).addTo(map).bindPopup('Driver');
      }
      map.setView([dlat, dlng], map.getZoom());
    }

    if (delLat && delLng) {
      if (deliveryMarkerRef.current) {
        deliveryMarkerRef.current.setLatLng([delLat, delLng]);
      } else {
        deliveryMarkerRef.current = L.marker([delLat, delLng], {
          icon: L.divIcon({ className: '', html: '📍', iconSize: [24, 24], iconAnchor: [12, 24] }),
        }).addTo(map).bindPopup('Delivery point');
      }
    }

    if (dlat && dlng && delLat && delLng) {
      const bounds = L.latLngBounds([dlat, dlng], [delLat, delLng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [driverLat, driverLng, trackingData?.currentLatitude, trackingData?.currentLongitude, trackingData?.deliveryLatitude, trackingData?.deliveryLongitude]);

  const currentLat = driverLat ?? trackingData?.deliveryLatitude;
  const currentLng = driverLng ?? trackingData?.deliveryLongitude;
  const activeStep = getActiveStep(orderStatus);
  const isDelivered = orderStatus === 'DELIVERED';
  const isCancelled = orderStatus === 'CANCELLED';

  const styles = {
    container: {
      maxWidth: 800, margin: '0 auto', padding: '1.5rem 1rem',
    },
    header: {
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
    },
    backBtn: {
      background: 'none', border: '1.5px solid var(--line)', borderRadius: 10,
      padding: '8px 16px', cursor: 'pointer', fontSize: 16, color: 'var(--ink)',
    },
    card: {
      background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20,
      border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)',
    },
    title: { fontSize: 20, fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ink)' },
    subtitle: { color: 'var(--muted)', fontSize: 14, margin: 0 },
    progressContainer: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'relative' as const, padding: '16px 0',
    },
    step: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      gap: 4, zIndex: 1,
    },
    stepDot: (active: boolean) => ({
      width: 28, height: 28, borderRadius: '50%',
      backgroundColor: active ? 'var(--brand)' : 'var(--line)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? '#fff' : 'var(--faint)', fontSize: 12, fontWeight: 700,
      transition: 'all 0.3s',
    }),
    stepLabel: (active: boolean) => ({
      fontSize: 11, color: active ? 'var(--brand)' : 'var(--faint)',
      fontWeight: active ? 600 : 400, textAlign: 'center' as const,
    }),
    line: {
      position: 'absolute' as const, top: 32, left: '5%', right: '5%',
      height: 3, backgroundColor: 'var(--line)', zIndex: 0,
    },
    lineFill: (pct: number) => ({
      position: 'absolute' as const, top: 0, left: 0,
      width: `${pct}%`, height: '100%',
      backgroundColor: 'var(--brand)', transition: 'width 0.5s',
    }),
    mapPlaceholder: {
      width: '100%', height: 220, backgroundColor: 'var(--bg)',
      borderRadius: 12, display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center', gap: 8,
      color: 'var(--muted)', fontSize: 14,
    },
    infoRow: {
      display: 'flex', justifyContent: 'space-between', padding: '8px 0',
      borderBottom: '1px solid var(--line-soft)',
    },
    infoLabel: { color: 'var(--muted)', fontSize: 14 },
    infoValue: { fontWeight: 600, fontSize: 14, color: 'var(--ink)' },
    badge: (status: string) => ({
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      backgroundColor: status === 'DELIVERED' ? 'var(--success-soft)' : status === 'OUT_FOR_DELIVERY' ? 'var(--info-soft)' : 'var(--warning-soft)',
      color: status === 'DELIVERED' ? 'var(--success)' : status === 'OUT_FOR_DELIVERY' ? 'var(--info)' : '#b45309',
    }),
    connectionBadge: {
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h1 style={styles.title}>Order Tracking</h1>
          <p style={styles.subtitle}>
            Order #{orderId?.substring(0, 8)}
            {connected && (
              <span style={{ ...styles.connectionBadge, backgroundColor: '#d1fae5', color: '#065f46', marginLeft: 8 }}>
                ● Live
              </span>
            )}
            {lastUpdate && <span style={{ marginLeft: 12, color: '#999', fontSize: 12 }}>Updated {lastUpdate}</span>}
          </p>
        </div>
      </div>

      {loading && <div style={styles.card}>Loading...</div>}

      {orderData && (
        <>
          {/* Status Timeline */}
          <div style={styles.card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 16 }}>
              Status: <span style={styles.badge(orderStatus)}>{STATUS_LABELS[orderStatus] || orderStatus}</span>
            </h2>
            {!isCancelled && (
              <div style={styles.progressContainer}>
                <div style={styles.line}>
                  <div style={styles.lineFill(activeStep >= 0 ? (activeStep / (STATUS_STEPS.length - 1)) * 100 : 0)} />
                </div>
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} style={styles.step}>
                    <div style={styles.stepDot(i <= activeStep)}>
                      {i < activeStep ? '✓' : i + 1}
                    </div>
                    <div style={styles.stepLabel(i <= activeStep)}>
                      {STATUS_LABELS[step]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map / Location */}
          {(currentLat && currentLng) ? (
            <div style={styles.card}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#666' }}>
                {isDelivered ? 'Delivery Location' : 'Driver Location'}
              </h3>
              <div ref={mapRef} style={{ width: '100%', height: 260, borderRadius: 10, overflow: 'hidden' }} />
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#64748b' }}>
                <span>🛵 Driver</span>
                <span>📍 Drop-off</span>
                {trackingData?.distanceKm != null && <span>📏 {trackingData.distanceKm.toFixed(1)} km</span>}
                {trackingData?.estimatedTimeMinutes != null && <span>⏱ {trackingData.estimatedTimeMinutes} min ETA</span>}
              </div>
            </div>
          ) : (
            trackingData && !isDelivered && (
              <div style={styles.card}>
                <div style={styles.mapPlaceholder}>
                  <span style={{ fontSize: 32 }}>🚚</span>
                  <span>Driver location will appear here once out for delivery</span>
                </div>
              </div>
            )
          )}

          {/* Delivery Info */}
          {trackingData && (
            <div style={styles.card}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Delivery Information</h3>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Pickup</span>
                <span style={styles.infoValue}>{trackingData.pickupAddress}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Delivery</span>
                <span style={styles.infoValue}>{trackingData.deliveryAddress}</span>
              </div>
              {trackingData.distanceKm != null && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Distance</span>
                  <span style={styles.infoValue}>{trackingData.distanceKm.toFixed(1)} km</span>
                </div>
              )}
              {trackingData.estimatedTimeMinutes != null && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Estimated Time</span>
                  <span style={styles.infoValue}>{trackingData.estimatedTimeMinutes} min</span>
                </div>
              )}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Delivery Status</span>
                <span style={styles.badge(trackingData.status)}>{trackingData.status}</span>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Order Summary</h3>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Total</span>
              <span style={styles.infoValue}>
                {orderData.currency} {orderData.totalAmount.toLocaleString()}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Delivery Fee</span>
              <span style={styles.infoValue}>
                {orderData.currency} {orderData.deliveryFee.toLocaleString()}
              </span>
            </div>
            <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
              <span style={styles.infoLabel}>Address</span>
              <span style={{ ...styles.infoValue, maxWidth: 300, textAlign: 'right' as const }}>
                {orderData.deliveryAddress}
              </span>
            </div>
          </div>

          {/* Chat */}
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>{t('chat.title')}</h3>
            <div ref={chatRef} style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {messages.length === 0 && <div style={{ color: 'var(--faint)', fontSize: 13, textAlign: 'center', padding: 12 }}>{t('chat.noMessages')}</div>}
              {messages.map((m: any) => (
                <div key={m.id} style={{ padding: '6px 10px', borderRadius: 8, maxWidth: '80%', fontSize: 13, background: m.senderRole === 'customer' ? 'var(--brand)' : 'var(--line-soft)', color: m.senderRole === 'customer' ? '#fff' : 'var(--ink)', alignSelf: m.senderRole === 'customer' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 2, opacity: 0.8 }}>{m.sender_role || m.senderRole}</div>
                  <div>{m.message}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                style={{ flex: 1, padding: '7px 10px' }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder={t('chat.placeholder')}
              />
              <button
                className="btn btn-primary"
                onClick={sendChat}
              >{t('chat.send')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
