import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  UserCheck,
  ListOrdered,
  PlusCircle,
  Tv,
  ChevronRight,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { useAuth } from '../../context/AuthContext';

interface StaffSidebarProps {
  onClose?: () => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({ onClose }) => {
  const { telemetry, generateToken, loadingAction } = useQueue();
  const { user } = useAuth();

  const navItems = [
    {
      to: '/staff/dashboard',
      label: 'Counter Service',
      icon: UserCheck,
      description: 'Call & serve current token',
    },
    {
      to: '/staff/queue',
      label: 'Waiting Queue',
      icon: ListOrdered,
      description: 'Full customer list',
      badge: telemetry?.tokens_waiting !== undefined ? `${telemetry.tokens_waiting}` : undefined,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] p-4 flex flex-col justify-between h-full shadow-2xs">
      <div className="space-y-6">
        {/* Active Counter Box */}
        <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1769E0] block mb-1">
            ASSIGNED COUNTER
          </span>
          <div className="text-2xl font-black text-[#172033] font-mono">
            {user?.counterNumber || 'Counter 03'}
          </div>
          <span className="text-xs text-[#64748B] font-semibold mt-1 block">
            {user?.name.split(' ')[0] || 'Staff Member'}
          </span>
        </div>

        {/* Navigation Items */}
        <div>
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-3 mb-2 block">
            Counter Operations
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

        {/* Quick Token Action */}
        <div className="pt-2">
          <button
            onClick={() => generateToken()}
            disabled={loadingAction === 'GENERATE'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1769E0] hover:bg-[#1558BD] text-white font-bold text-xs tracking-wider shadow-sm active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>GENERATE TOKEN [N]</span>
          </button>
        </div>
      </div>

      {/* Bottom Display Quicklink */}
      <div className="pt-4 border-t border-[#F1F5F9]">
        <NavLink
          to="/display"
          target="_blank"
          className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BFDBFE] hover:bg-[#EFF6FF] transition-all text-xs text-[#172033] group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#1769E0] group-hover:bg-[#1769E0] group-hover:text-white transition-colors">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold block text-[#172033]">Public Display</span>
              <span className="text-[10px] text-[#64748B]">View TV Monitor</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1769E0] transition-colors" />
        </NavLink>
      </div>
    </aside>
  );
};
