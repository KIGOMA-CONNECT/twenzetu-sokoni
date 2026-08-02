import { useNotifications } from '../context/NotificationContext';

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();

  return (
    <div className="page" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="flex items-center justify-between wrap" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Notifications</h1>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && notifications.length === 0 ? (
          <div className="empty">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="empty">No notifications yet. They'll appear here when something happens.</div>
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
