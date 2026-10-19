import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false, children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // 1. Show proper loading state while authentication is being restored
  // Never briefly flash protected content to guests
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <p className="font-heading font-bold text-sm text-navy-900 tracking-wide">
            Restoring secure session...
          </p>
          <p className="text-xs text-slateText">
            Verifying travel intelligence credentials
          </p>
        </div>
      </div>
    );
  }

  // 2. If unauthenticated, redirect to login preserving destination
  if (!user) {
    const destination = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(destination)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // 3. If administrative access required, enforce admin role
  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-card">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-navy-900">
          Restricted Administrator Access
        </h2>
        <p className="text-xs text-slateText leading-relaxed">
          This portal requires verified platform administration credentials. Your current account does not have administrative privileges.
        </p>
        <Link
          to="/app"
          className="inline-block px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          Return to Traveler Dashboard
        </Link>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
