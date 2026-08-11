import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api, { clearSession } from '../api/client';
import type { User, AuthResponse, VerifyOtpResponse, VendorAccessContext } from '../types';

const STAFF_ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'support_admin', 'compliance_admin', 'marketing_admin'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, code: string) => Promise<{ registered: boolean }>;
  logout: () => Promise<void>;
  refreshVendorAccess: () => Promise<void>;
  vendorAccess: VendorAccessContext | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isVendor: boolean;
  isVendorOwner: boolean;
  hasVendorPermission: (permission: string) => boolean;
  isCustomer: boolean;
  isDriver: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function persistTokens(payload: AuthResponse) {
  localStorage.setItem('accessToken', payload.accessToken);
  localStorage.setItem('refreshToken', payload.refreshToken);
  localStorage.setItem('user', JSON.stringify(payload.user));
  localStorage.setItem('tenantId', payload.user?.tenantId ?? '');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vendorAccess, setVendorAccess] = useState<VendorAccessContext | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshVendorAccess = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setVendorAccess(null);
      return;
    }
    try {
      const res = await api.get('/vendor-staff/me');
      const ctx = (res.data?.data ?? res.data) as VendorAccessContext | null;
      setVendorAccess(ctx);
    } catch {
      setVendorAccess(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser && storedUser !== 'undefined') {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
          void refreshVendorAccess();
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    }
    setLoading(false);
  }, [refreshVendorAccess]);

  const login = async (phoneNumber: string, password: string) => {
    const res = await api.post('/auth/login', { phoneNumber, password });
    const payload = (res.data.data || res.data) as AuthResponse;
    persistTokens(payload);
    setUser(payload.user);
    void refreshVendorAccess();
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
      void refreshVendorAccess();
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
    setVendorAccess(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    sendOtp,
    verifyOtp,
    logout,
    refreshVendorAccess,
    vendorAccess,
    isAdmin: STAFF_ADMIN_ROLES.includes(user?.role || ''),
    isSuperAdmin: user?.role === 'super_admin',
    isVendor: user?.role === 'vendor' || !!vendorAccess,
    isVendorOwner: user?.role === 'vendor',
    hasVendorPermission: (permission: string) =>
      !!(user?.role === 'vendor' || vendorAccess?.isOwner) || (vendorAccess?.permissions?.includes(permission) ?? false),
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
