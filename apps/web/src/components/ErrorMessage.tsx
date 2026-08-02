export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="alert alert-error" style={{ margin: '0.5rem 0' }}>
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}
