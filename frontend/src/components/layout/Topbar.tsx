import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Tv,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';
import { ConnectionPills } from '../common/ConnectionPills';

interface TopbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, role, logout } = useAuth();
  const { telemetry, isConnected, isReconnecting } = useQueue();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-all shadow-2xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#172033] border border-[#E2E8F0] transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[#1769E0] shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#172033] uppercase">
                  Smart Bank
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold bg-[#EFF6FF] text-[#1769E0] rounded-full border border-[#BFDBFE]">
                  {role === 'manager'
                    ? 'MANAGER PORTAL'
                    : role === 'receptionist'
                    ? 'RECEPTIONIST PORTAL'
                    : role === 'staff'
                    ? 'STAFF PORTAL'
                    : 'PORTAL'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] hidden sm:block font-medium">
                {user?.branchName || 'Metro Central Flagship Branch'}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Live Connection Indicators */}
        <div className="hidden xl:flex items-center">
          <ConnectionPills
            telemetry={telemetry}
            isConnected={isConnected}
            isReconnecting={isReconnecting}
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Public Display Link */}
          <Link
            to="/display"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Public TV Queue Display in new tab"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#172033] text-xs font-semibold transition-all shadow-2xs group"
          >
            <Tv className="w-3.5 h-3.5 text-[#1769E0] group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">TV Display</span>
            <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
          </Link>

          {/* User Profile Badge */}
          {user && (
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1769E0] flex items-center justify-center font-bold font-mono text-xs">
                {user.role === 'manager' ? 'M' : user.role === 'receptionist' ? 'R' : 'S'}
              </div>
              <div className="text-left">
                <span className="font-bold text-[#172033] block text-xs truncate max-w-[120px]">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-[#64748B] block font-mono">
                  {user.counterNumber || 'Branch Ops'}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FCDAD7] border border-[#FCA5A5] text-[#DC2626] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
