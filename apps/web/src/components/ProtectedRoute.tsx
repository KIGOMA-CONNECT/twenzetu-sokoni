import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import type { UserRole } from '../types';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { user, loading, vendorAccess } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && user.role !== 'super_admin') {
    const hasRole = roles.includes(user.role);
    const hasVendorAccess = roles.includes('vendor') && !!vendorAccess;
    if (!hasRole && !hasVendorAccess) return <Navigate to="/dashboard" replace />;
  }

  return children;
}