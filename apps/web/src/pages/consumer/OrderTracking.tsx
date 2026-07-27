import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';
import type { Order, TrackingInfo } from '../../types';

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
  const { data: orderData, loading } = useApi<Order>(orderId ? `/orders/${orderId}` : null);
  const { data: trackingData, refetch: refetchTracking } = useApi<TrackingInfo>(
    orderId ? `/deliveries/order/${orderId}/tracking` : null,
  );
  const { connected, subscribe, trackOrder, untrackOrder } = useSocket();
  const [driverLat, setDriverLat] = useState<number | undefined>();
  const [driverLng, setDriverLng] = useState<number | undefined>();
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');

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
    });

    const unsub2 = subscribe('delivery-status-changed', (data: any) => {
      if (data.status === 'DELIVERED' || data.status === 'IN_TRANSIT') {
        setOrderStatus((data as any).orderStatus || orderStatus);
        refetchTracking();
      }
    });

    return () => { unsub1(); unsub2(); };
  }, [orderId, subscribe]);

  const currentLat = driverLat ?? trackingData?.deliveryLatitude;
  const currentLng = driverLng ?? trackingData?.deliveryLongitude;
  const activeStep = getActiveStep(orderStatus);
  const isDelivered = orderStatus === 'DELIVERED';
  const isCancelled = orderStatus === 'CANCELLED';

  const styles: Record<string, React.CSSProperties> = {
    container: {
      maxWidth: 800, margin: '0 auto', padding: 24,
    },
    header: {
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
    },
    backBtn: {
      background: 'none', border: '1px solid #ddd', borderRadius: 8,
      padding: '8px 16px', cursor: 'pointer', fontSize: 16,
    },
    card: {
      background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    title: { fontSize: 20, fontWeight: 700, margin: '0 0 4px 0' },
    subtitle: { color: '#666', fontSize: 14, margin: 0 },
    progressContainer: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'relative', padding: '16px 0',
    },
    step: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 4, zIndex: 1,
    },
    stepDot: (active: boolean) => ({
      width: 28, height: 28, borderRadius: '50%',
      backgroundColor: active ? '#2563eb' : '#e5e7eb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? '#fff' : '#999', fontSize: 12, fontWeight: 700,
      transition: 'all 0.3s',
    }),
    stepLabel: (active: boolean) => ({
      fontSize: 11, color: active ? '#2563eb' : '#999',
      fontWeight: active ? 600 : 400, textAlign: 'center' as const,
    }),
    line: {
      position: 'absolute', top: 32, left: '5%', right: '5%',
      height: 3, backgroundColor: '#e5e7eb', zIndex: 0,
    },
    lineFill: (pct: number) => ({
      position: 'absolute', top: 0, left: 0,
      width: `${pct}%`, height: '100%',
      backgroundColor: '#2563eb', transition: 'width 0.5s',
    }),
    mapPlaceholder: {
      width: '100%', height: 220, backgroundColor: '#f3f4f6',
      borderRadius: 12, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      color: '#666', fontSize: 14,
    },
    infoRow: {
      display: 'flex', justifyContent: 'space-between', padding: '8px 0',
      borderBottom: '1px solid #f3f4f6',
    },
    infoLabel: { color: '#666', fontSize: 14 },
    infoValue: { fontWeight: 600, fontSize: 14 },
    badge: (status: string) => ({
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      backgroundColor: status === 'DELIVERED' ? '#d1fae5' : status === 'OUT_FOR_DELIVERY' ? '#dbeafe' : '#fef3c7',
      color: status === 'DELIVERED' ? '#065f46' : status === 'OUT_FOR_DELIVERY' ? '#1e40af' : '#92400e',
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
              <a
                href={`https://www.openstreetmap.org/?mlat=${currentLat}&mlon=${currentLng}#map=15/${currentLat}/${currentLng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={styles.mapPlaceholder}>
                  <span style={{ fontSize: 32 }}>📍</span>
                  <span>{currentLat.toFixed(6)}, {currentLng.toFixed(6)}</span>
                  <span style={{ fontSize: 12, color: '#2563eb' }}>Click to open in OpenStreetMap →</span>
                </div>
              </a>
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
        </>
      )}
    </div>
  );
}
