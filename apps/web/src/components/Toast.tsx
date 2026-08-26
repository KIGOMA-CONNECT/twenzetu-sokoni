import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant?: 'success' | 'danger' | 'info';
}

export function ToastStack({
  toasts,
  onDismiss,
  autoDismissMs = 4000,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      window.setTimeout(() => onDismiss(t.id), autoDismissMs),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [toasts, onDismiss, autoDismissMs]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.variant ?? 'info'}`}>
          <div style={{ minWidth: 0 }}>
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div>{toast.message}</div>
          </div>
          <button
            className="toast-close"
            aria-label={t('notifications.dismiss')}
            onClick={() => onDismiss(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

let toastCounter = 0;

export function createToast(
  setToasts: (updater: (prev: ToastItem[]) => ToastItem[]) => void,
  toast: Omit<ToastItem, 'id'>,
): string {
  const id = `t${++toastCounter}-${Date.now()}`;
  setToasts((prev) => [...prev.slice(-3), { id, ...toast }]);
  return id;
}