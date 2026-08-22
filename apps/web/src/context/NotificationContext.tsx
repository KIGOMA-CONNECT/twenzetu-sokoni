import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications?limit=20'),
        api.get('/notifications/unread-count'),
      ]);
      let list = listRes.data.data !== undefined ? listRes.data.data : listRes.data;
      if (!Array.isArray(list) && Array.isArray(list?.data)) list = list.data;
      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(countRes.data.count ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time delivery: the server emits `notification` over Socket.IO the
  // moment one is created. Polling stays only as a slow fallback for clients
  // that never open a socket (cuts /notifications traffic by ~95%).
  const { connected, subscribe } = useSocket();
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    refetch();
    const interval = setInterval(() => refetchRef.current(), connected ? 300000 : 60000);
    return () => clearInterval(interval);
  }, [refetch, connected]);

  useEffect(() =>
    subscribe('notification', () => { void refetchRef.current(); })
  , [subscribe]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, refetch, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
