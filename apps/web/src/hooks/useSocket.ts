import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

type EventHandler = (data: any) => void;

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');

    const socket = io('/marketplace', {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth: { token },
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('authenticate', { userId: user.id, tenantId: user.tenantId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socket.onAny((event, data) => {
      const handlers = handlersRef.current.get(event);
      if (handlers) {
        handlers.forEach((fn) => fn(data));
      }
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.id, user?.tenantId]);

  const subscribe = useCallback((event: string, handler: EventHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);
    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  const trackOrder = useCallback((orderId: string) => {
    socketRef.current?.emit('track-order', { orderId });
  }, []);

  const untrackOrder = useCallback((orderId: string) => {
    socketRef.current?.emit('untrack-order', { orderId });
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { connected, subscribe, trackOrder, untrackOrder, emit, socket: socketRef.current };
}
