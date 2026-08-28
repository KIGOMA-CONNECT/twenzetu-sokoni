import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../context/NotificationContext';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
  isPushSupported,
} from '../push';

type PushState =
  | { status: 'loading' }
  | { status: 'unsupported' }
  | { status: 'idle' }
  | { status: 'enabled' }
  | { status: 'denied' }
  | { status: 'error'; message: string };

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();
  const { t } = useTranslation();
  const [pushState, setPushState] = useState<PushState>({ status: 'loading' });

  const refreshPushStatus = useCallback(async () => {
    if (!isPushSupported()) {
      setPushState({ status: 'unsupported' });
      return;
    }
    const status = await getPushStatus();
    if (status.permission === 'denied') {
      setPushState({ status: 'denied' });
    } else if (status.subscribed) {
      setPushState({ status: 'enabled' });
    } else {
      setPushState({ status: 'idle' });
    }
  }, []);

  useEffect(() => {
    refreshPushStatus();
  }, [refreshPushStatus]);

  const handleEnable = async () => {
    const result = await enablePushNotifications();
    if (result.ok) {
      setPushState({ status: 'enabled' });
    } else if (result.error === 'denied') {
      setPushState({ status: 'denied' });
    } else if (result.error === 'unsupported') {
      setPushState({ status: 'unsupported' });
    } else if (result.error === 'unconfigured') {
      setPushState({ status: 'error', message: 'Push notifications are not configured yet. Please try again later.' });
    } else {
      setPushState({ status: 'error', message: 'Could not enable push notifications. Please try again.' });
    }
  };

  const handleDisable = async () => {
    await disablePushNotifications();
    setPushState({ status: 'idle' });
  };

  return (
    <div className="page" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="flex items-center justify-between wrap" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>{t('notification.title')}</h1>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {unreadCount > 0 ? t('notification.unread', { count: unreadCount }) : t('notification.allCaughtUp')}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            {t('notification.markAllRead')}
          </button>
        )}
      </div>

      {pushState.status !== 'unsupported' && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <div className="flex items-center justify-between wrap" style={{ gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                {t('notification.pushNotifications')}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '0.15rem', lineHeight: 1.4 }}>
                {pushState.status === 'loading' && t('notification.checkingDevice')}
                {pushState.status === 'idle' && t('notification.pushIdle')}
                {pushState.status === 'enabled' && t('notification.pushEnabled')}
                {pushState.status === 'denied' && t('notification.pushDenied')}
                {pushState.status === 'error' && pushState.message}
              </div>
            </div>
            {pushState.status !== 'loading' && pushState.status !== 'error' && (
              <button
                className={`btn btn-sm ${pushState.status === 'enabled' ? 'btn-outline' : 'btn-primary'}`}
                onClick={pushState.status === 'enabled' ? handleDisable : handleEnable}
                disabled={pushState.status === 'denied'}
              >
                {pushState.status === 'enabled' ? t('notification.disable') : t('notification.enable')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && notifications.length === 0 ? (
          <div className="empty">{t('notification.loading')}</div>
        ) : notifications.length === 0 ? (
          <div className="empty">{t('notification.empty')}</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => { if (!n.isRead) markRead(n.id); }}
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--line)',
                cursor: 'pointer',
                background: n.isRead ? 'transparent' : 'var(--brand-soft)',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{n.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '0.25rem', lineHeight: 1.4 }}>{n.message}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
