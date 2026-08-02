export function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--muted)' }}>
      <span className="spinner" />
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading...</span>
    </div>
  );
}
