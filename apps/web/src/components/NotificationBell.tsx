import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../context/NotificationContext';

export function NotificationBell({ onSurface = false }: { onSurface?: boolean }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        className="icon-btn"
        aria-label={t('notifications.title')}
        style={onSurface ? { color: 'var(--text)' } : {}}
      >
        🔔
        {unreadCount > 0 && <span className="count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="dropdown" style={onSurface ? { position: 'fixed' } : {}}>
          <div className="dropdown-head">
            <span>{t('notifications.title')}</span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {unreadCount > 0 && <button onClick={markAllRead}>{t('notifications.markAllRead')}</button>}
              <button onClick={() => { navigate('/notifications'); setOpen(false); }}>{t('notifications.viewAll')}</button>
            </div>
          </div>

          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--faint)', fontSize: '0.8rem' }}>{t('notifications.noNotifications')}</div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  onClick={() => { markRead(n.id); }}
                  style={{
                    padding: '0.65rem 1rem',
                    borderBottom: '1px solid var(--line-soft)',
                    cursor: 'pointer',
                    background: n.isRead ? 'transparent' : 'var(--info-soft)',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.15rem', lineHeight: 1.3 }}>{n.message}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--faint)', marginTop: '0.25rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
