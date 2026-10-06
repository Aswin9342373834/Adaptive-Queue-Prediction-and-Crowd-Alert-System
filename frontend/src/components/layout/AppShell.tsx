import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { Topbar } from './Topbar';
import { ManagerSidebar } from './ManagerSidebar';
import { StaffSidebar } from './StaffSidebar';
import { ReceptionSidebar } from './ReceptionSidebar';
import { MobileNav } from './MobileNav';
import { CheckCircle2 } from 'lucide-react';

interface AppShellProps {
  requiredRole?: 'manager' | 'staff' | 'receptionist';
}

export const AppShell: React.FC<AppShellProps> = ({ requiredRole }) => {
  const { role, isAuthenticated } = useAuth();
  const { lastFeedback } = useQueue();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Route protection
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to user's assigned portal
    const target =
      role === 'manager'
        ? '/manager/dashboard'
        : role === 'receptionist'
        ? '/reception/dashboard'
        : '/staff/dashboard';
    return <Navigate to={target} replace />;
  }

  const renderSidebar = (onClose?: () => void) => {
    if (role === 'manager') return <ManagerSidebar onClose={onClose} />;
    if (role === 'receptionist') return <ReceptionSidebar onClose={onClose} />;
    return <StaffSidebar onClose={onClose} />;
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#172033] flex flex-col font-sans antialiased selection:bg-[#1769E0] selection:text-white">
      {/* 1. Global Portal Topbar */}
      <Topbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* 2. Main Body with Sidebar + Content */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          {renderSidebar()}
        </div>

        {/* Mobile / Tablet Drawer Sidebar */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer Content */}
            <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl">
              {renderSidebar(() => setIsSidebarOpen(false))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-8">
          {/* Action Feedback Toast */}
          {lastFeedback && (
            <div className="fixed top-18 right-6 z-50 max-w-sm animate-bounce">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-[#BFDBFE] text-[#1769E0] shadow-lg text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{lastFeedback}</span>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
