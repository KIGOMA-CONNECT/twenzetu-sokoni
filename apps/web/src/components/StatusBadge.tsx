const statusColors: Record<string, { cls: string; dot: string }> = {
  ACTIVE: { cls: 'badge-green', dot: '#16a34a' },
  PENDING: { cls: 'badge-amber', dot: '#f59e0b' },
  SUSPENDED: { cls: 'badge-red', dot: '#dc2626' },
  VERIFIED: { cls: 'badge-green', dot: '#16a34a' },
  PENDING_VERIFICATION: { cls: 'badge-amber', dot: '#f59e0b' },
  DELIVERED: { cls: 'badge-green', dot: '#16a34a' },
  CONFIRMED: { cls: 'badge-blue', dot: '#2563eb' },
  PLACED: { cls: 'badge-amber', dot: '#f59e0b' },
  PREPARING: { cls: 'badge-amber', dot: '#f59e0b' },
  READY_FOR_PICKUP: { cls: 'badge-blue', dot: '#2563eb' },
  OUT_FOR_DELIVERY: { cls: 'badge-blue', dot: '#2563eb' },
  CANCELLED: { cls: 'badge-red', dot: '#dc2626' },
  ESCROW_HELD: { cls: 'badge-amber', dot: '#f59e0b' },
  RELEASED: { cls: 'badge-green', dot: '#16a34a' },
  REFUNDED: { cls: 'badge-red', dot: '#dc2626' },
  OPEN: { cls: 'badge-red', dot: '#dc2626' },
  RESOLVED: { cls: 'badge-green', dot: '#16a34a' },
  CLOSED: { cls: 'badge-slate', dot: '#64748b' },
};

export function StatusBadge({ status }: { status: string | undefined | null }) {
  if (!status) return null;
  const color = statusColors[status] || { cls: 'badge-slate', dot: '#64748b' };
  return (
    <span className={`badge ${color.cls}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.dot, display: 'inline-block' }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}
