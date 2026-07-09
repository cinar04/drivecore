// React auto import
// import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import { ToastProvider } from './context/ToastContext';
import { UpdateNotification } from './components/updater/UpdateNotification';
import { ThemeProvider } from './context/ThemeContext';
import { AccentProvider } from './context/AccentContext';
import { FontProvider } from './context/FontContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OrgSetupPage } from './pages/OrgSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { DriversPage } from './pages/DriversPage';
import { DriverDetailPage } from './pages/DriverDetailPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ActivityPage } from './pages/ActivityPage';
import { OrgMembersPage } from './pages/OrgMembersPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PricingPage } from './pages/PricingPage';
import { ComparisonPage } from './pages/ComparisonPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <AccentProvider>
        <FontProvider>
        <ToastProvider>
          <UpdateNotification />
          <OrgProvider>
            <HashRouter>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Kurum kurulum — giriş gerekli ama org gerekmez */}
                <Route element={<ProtectedRoute requireOrg={false} />}>
                  <Route path="/org/setup" element={<OrgSetupPage />} />
                  <Route path="/org/join" element={<OrgSetupPage />} />
                </Route>

                {/* Protected + org required */}
                <Route element={<ProtectedRoute requireOrg={true} />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/drivers" element={<DriversPage />} />
                    <Route path="/drivers/:id" element={<DriverDetailPage />} />
                    <Route path="/vehicles" element={<VehiclesPage />} />
                    <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    <Route path="/org/members" element={<OrgMembersPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/compare/:type" element={<ComparisonPage />} />
                  </Route>
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </HashRouter>
          </OrgProvider>
        </ToastProvider>
        </FontProvider>
        </AccentProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
