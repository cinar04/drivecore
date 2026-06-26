import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { PageLoader } from '../ui/LoadingSkeleton';

interface ProtectedRouteProps {
  requireOrg?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireOrg = true }) => {
  const { currentUser, loading } = useAuth();
  const { currentOrg, loadingOrg, userOrgs } = useOrg();

  if (loading || loadingOrg) return <PageLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;

  // Kurum gerektiren sayfalar için
  if (requireOrg && !currentOrg) {
    // Kurumu olan ama aktif seçili değilse dashboard'a yönlendir
    if (userOrgs.length === 0) return <Navigate to="/org/setup" replace />;
  }

  return <Outlet />;
};
