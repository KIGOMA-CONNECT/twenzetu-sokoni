import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useApi<T>(url: string | null, deps?: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!url) { setLoading(false); setData(null); return; }
    setLoading(true);
    try {
      const res = await api.get(url);
      let payload = res.data;
      if (payload?.data !== undefined) payload = payload.data;
      if (payload?.data !== undefined && payload.data !== null) {
        if (Array.isArray(payload.data)) {
          payload = payload.data;
        } else if (typeof payload.data === 'object' && Object.keys(payload).length === 1) {
          payload = payload.data;
        }
      }
      setData(payload as T);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Keep deps-based refetch for callers that pass explicit deps (backwards compat), but also ensure url changes trigger
  useEffect(() => {
    if (deps) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps || []);

  return { data, loading, error, refetch };
}