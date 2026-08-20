export function Skeleton({
  variant = 'block',
  width,
  height,
  style,
  className,
}: {
  variant?: 'block' | 'text' | 'circle';
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`skeleton ${variant === 'circle' ? 'skeleton-circle' : variant === 'text' ? 'skeleton-text' : 'skeleton-block'} ${className ?? ''}`}
      style={{ ...(width != null ? { width } : {}), ...(height != null ? { height } : {}), ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <Skeleton variant="block" height={140} />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="45%" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Skeleton variant="circle" width={36} height={36} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="35%" />
          </div>
        </div>
      ))}
    </div>
  );
}