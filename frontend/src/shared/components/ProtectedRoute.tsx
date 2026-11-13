import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { LoadingState } from './LoadingState';
import { Card } from './Card';
import { Button } from './Button';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <LoadingState message="Authenticating VirtuPass identity..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect unauthenticated user to login, preserving destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardLink =
      user.role === 'ADMIN'
        ? '/admin/dashboard'
        : user.role === 'ORGANIZER'
        ? '/organizer/dashboard'
        : '/user/dashboard';

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card variant="default" padding="lg" className="max-w-md text-center border-rose-500/30 bg-rose-950/10">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Access Denied (Role Restricted)</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            You are signed in as <strong>{user.fullName}</strong> ({user.role}). This section is restricted to <strong>{allowedRoles.join(', ')}</strong> accounts.
          </p>
          <div className="mt-6">
            <Link to={dashboardLink}>
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Authorized Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return children ? <>{children}</> : null;
};
