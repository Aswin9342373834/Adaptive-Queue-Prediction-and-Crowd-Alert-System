import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { PublicDisplayPage } from './pages/PublicDisplayPage';
import { LoginPage } from './pages/LoginPage';

// Manager Pages
import { ManagerOverviewPage } from './pages/manager/ManagerOverviewPage';
import { ManagerAnalyticsPage } from './pages/manager/ManagerAnalyticsPage';
import { ManagerPredictionPage } from './pages/manager/ManagerPredictionPage';
import { ManagerVisionPage } from './pages/manager/ManagerVisionPage';
import { ManagerAlertsPage } from './pages/manager/ManagerAlertsPage';
import { ManagerHardwarePage } from './pages/manager/ManagerHardwarePage';
import { ManagerReportsPage } from './pages/manager/ManagerReportsPage';

// Staff Pages
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { StaffQueuePage } from './pages/staff/StaffQueuePage';

// Receptionist Pages
import { ReceptionDashboardPage } from './pages/reception/ReceptionDashboardPage';

// Root redirect component
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  if (role === 'receptionist') return <Navigate to="/reception/dashboard" replace />;
  return <Navigate to="/staff/dashboard" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. Public Television Queue Display (NO LOGIN REQUIRED) */}
            <Route path="/display" element={<PublicDisplayPage />} />

            {/* 2. Employee Login Portal */}
            <Route path="/login" element={<LoginPage />} />

            {/* 3. Bank Manager Portal */}
            <Route path="/manager" element={<AppShell requiredRole="manager" />}>
              <Route index element={<Navigate to="/manager/dashboard" replace />} />
              <Route path="dashboard" element={<ManagerOverviewPage />} />
              <Route path="analytics" element={<ManagerAnalyticsPage />} />
              <Route path="prediction" element={<ManagerPredictionPage />} />
              <Route path="vision" element={<ManagerVisionPage />} />
              <Route path="alerts" element={<ManagerAlertsPage />} />
              <Route path="hardware" element={<ManagerHardwarePage />} />
              <Route path="reports" element={<ManagerReportsPage />} />
            </Route>

            {/* 4. Bank Reception Desk Portal */}
            <Route path="/reception" element={<AppShell requiredRole="receptionist" />}>
              <Route index element={<Navigate to="/reception/dashboard" replace />} />
              <Route path="dashboard" element={<ReceptionDashboardPage />} />
            </Route>

            {/* 5. Bank Staff Counter Portal */}
            <Route path="/staff" element={<AppShell requiredRole="staff" />}>
              <Route index element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboardPage />} />
              <Route path="queue" element={<StaffQueuePage />} />
            </Route>

            {/* 6. Default & Catch-All Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </QueueProvider>
    </AuthProvider>
  );
}

export default App;
