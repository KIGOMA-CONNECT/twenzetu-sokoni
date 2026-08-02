import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { clearSession } from '../api/client';
import type { User, AuthResponse, VerifyOtpResponse } from '../types';

const STAFF_ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, code: string) => Promise<{ registered: boolean }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isVendor: boolean;
  isCustomer: boolean;
  isDriver: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function persistTokens(payload: AuthResponse) {
  localStorage.setItem('accessToken', payload.accessToken);
  localStorage.setItem('refreshToken', payload.refreshToken);
  localStorage.setItem('user', JSON.stringify(payload.user));
  localStorage.setItem('tenantId', 'a0000000-0000-0000-0000-000000000002');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser && storedUser !== 'undefined') {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    }
    setLoading(false);
  }, []);

  const login = async (phoneNumber: string, password: string) => {
    const res = await api.post('/auth/login', { phoneNumber, password });
    const payload = (res.data.data || res.data) as AuthResponse;
    persistTokens(payload);
    setUser(payload.user);
  };

  const sendOtp = async (phoneNumber: string) => {
    await api.post('/auth/send-otp', { phoneNumber });
  };

  const verifyOtp = async (phoneNumber: string, code: string) => {
    const res = await api.post('/auth/verify-otp', { phoneNumber, code });
    const payload = (res.data.data || res.data) as VerifyOtpResponse;
    if (payload.verified && payload.registered) {
      persistTokens(payload);
      setUser(payload.user);
    }
    return { registered: payload.verified ? payload.registered : false };
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Best-effort: always clear the local session.
    }
    clearSession();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    sendOtp,
    verifyOtp,
    logout,
    isAdmin: STAFF_ADMIN_ROLES.includes(user?.role || ''),
    isSuperAdmin: user?.role === 'super_admin',
    isVendor: user?.role === 'vendor',
    isCustomer: user?.role === 'customer',
    isDriver: user?.role === 'driver',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
