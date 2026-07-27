export function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', margin: '1rem 0' }}>
      {message}
    </div>
  );
}