const statusColors: Record<string, string> = {
  ACTIVE: '#16a34a', PENDING: '#f59e0b', SUSPENDED: '#dc2626',
  VERIFIED: '#16a34a', PENDING_VERIFICATION: '#f59e0b',
  DELIVERED: '#16a34a', CONFIRMED: '#3b82f6', PLACED: '#f59e0b', CANCELLED: '#dc2626',
  ESCROW_HELD: '#f59e0b', RELEASED: '#16a34a', REFUNDED: '#dc2626',
  OPEN: '#dc2626', RESOLVED: '#16a34a', CLOSED: '#64748b',
};

export function StatusBadge({ status }: { status: string | undefined | null }) {
  if (!status) return null;
  const color = statusColors[status] || '#64748b';
  return (
    <span style={{ background: color + '20', color, padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}