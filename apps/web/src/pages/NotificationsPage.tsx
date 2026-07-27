import { useNotifications } from '../context/NotificationContext';

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px', margin: '0 auto' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  item: { padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' },
  title: { fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' },
  msg: { fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.4 },
  time: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem', fontSize: '0.9rem' },
  btnRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer' },
  outlineBtn: { background: 'transparent', color: '#2563eb', border: '1px solid #bfdbfe' },
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={styles.header}>Notifications</h1>
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button style={{ ...styles.btn, ...styles.outlineBtn }} onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div style={styles.card}>
        {loading && notifications.length === 0 ? (
          <div style={styles.empty}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={styles.empty}>No notifications yet. They'll appear here when something happens.</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => { if (!n.isRead) markRead(n.id); }}
              style={{ ...styles.item, background: n.isRead ? '#fff' : '#eff6ff' }}
            >
              <div style={styles.title}>{n.title}</div>
              <div style={styles.msg}>{n.message}</div>
              <div style={styles.time}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
