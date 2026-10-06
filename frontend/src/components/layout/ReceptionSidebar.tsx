import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  UserPlus,
  Tv,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { useAuth } from '../../context/AuthContext';

interface ReceptionSidebarProps {
  onClose?: () => void;
}

export const ReceptionSidebar: React.FC<ReceptionSidebarProps> = ({ onClose }) => {
  const { telemetry } = useQueue();
  const { user } = useAuth();

  const navItems = [
    {
      to: '/reception/dashboard',
      label: 'Register Customer',
      icon: UserPlus,
      description: 'Issue tokens & assign counters',
      badge: telemetry?.tokens_waiting !== undefined ? `${telemetry.tokens_waiting} in queue` : undefined,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] p-4 flex flex-col justify-between h-full shadow-2xs">
      <div className="space-y-6">
        {/* Reception Desk Profile Card */}
        <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1769E0] block mb-1">
            FRONT DESK
          </span>
          <div className="text-xl font-black text-[#172033] font-mono">
            Reception Desk
          </div>
          <span className="text-xs text-[#64748B] font-semibold mt-1 block">
            {user?.name || 'Priya Nair (Receptionist)'}
          </span>
        </div>

        {/* Navigation Items */}
        <div>
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-3 mb-2 block">
            Reception Desk
          </span>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all group ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#1769E0] font-bold border border-[#BFDBFE] shadow-2xs'
                        : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-[#1769E0]' : 'text-[#64748B] group-hover:text-[#1769E0]'
                          }`}
                        />
                        <span className="block">{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-[#1769E0] text-white'
                              : 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight
                          className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isActive ? 'opacity-100 text-[#1769E0]' : 'text-[#94A3B8]'
                          }`}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Desk Quick Stats */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
            <Sparkles className="w-4 h-4 text-[#1769E0]" />
            <span>Branch Overview</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E2E8F0]">
            <span className="text-[#64748B] font-medium">Waiting in Lobby</span>
            <span className="font-bold text-[#172033] font-mono">
              {telemetry?.tokens_waiting ?? 0}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B] font-medium">Avg Wait Time</span>
            <span className="font-bold text-[#16A34A] font-mono">
              {telemetry?.average_service_display || '3:00 min'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Display Link */}
      <div className="pt-4 border-t border-[#E2E8F0]">
        <Link
          to="/display"
          target="_blank"
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] text-xs font-bold text-[#1769E0] transition-all shadow-2xs"
        >
          <Tv className="w-4 h-4" />
          <span>Open Public Display</span>
        </Link>
      </div>
    </aside>
  );
};
