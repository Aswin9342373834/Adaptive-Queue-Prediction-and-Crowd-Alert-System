import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Camera,
  Bell,
  Cpu,
  FileText,
  ChevronRight,
  Tv,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';

interface ManagerSidebarProps {
  onClose?: () => void;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ onClose }) => {
  const { telemetry } = useQueue();

  const navItems = [
    {
      to: '/manager/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Branch health & KPIs',
    },
    {
      to: '/manager/analytics',
      label: 'Queue Analytics',
      icon: TrendingUp,
      description: 'Wait times & rates',
    },
    {
      to: '/manager/prediction',
      label: 'Crowd Prediction',
      icon: Sparkles,
      description: 'AI forecasts & actions',
      badge: telemetry?.congestion_level !== 'NORMAL' ? telemetry?.congestion_level : undefined,
    },
    {
      to: '/manager/vision',
      label: 'Live Vision',
      icon: Camera,
      description: 'Webcam & spatial count',
    },
    {
      to: '/manager/alerts',
      label: 'Alerts',
      icon: Bell,
      description: 'System alert history',
      badge: telemetry?.is_long_wait ? 'Warning' : undefined,
    },
    {
      to: '/manager/hardware',
      label: 'Hardware',
      icon: Cpu,
      description: 'ESP32 LED & Buzzer',
      badge: telemetry?.esp32_connected ? 'Online' : 'Standby',
    },
    {
      to: '/manager/reports',
      label: 'Reports',
      icon: FileText,
      description: 'Daily executive summary',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] p-4 flex flex-col justify-between h-full shadow-2xs">
      <div className="space-y-6">
        {/* Navigation Category Label */}
        <div>
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-3 mb-2 block">
            Management Portal
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
                        <div className="text-left">
                          <span className="block">{item.label}</span>
                        </div>
                      </div>

                      {item.badge ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isActive
                              ? 'bg-[#1769E0] text-white'
                              : item.badge === 'CRITICAL' || item.badge === 'Warning'
                              ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                              : item.badge === 'HIGH' || item.badge === 'MODERATE'
                              ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
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
      </div>

      {/* Bottom Display Banner Quicklink */}
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
              <span className="text-[10px] text-[#64748B]">TV Monitor Mode</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1769E0] transition-colors" />
        </NavLink>
      </div>
    </aside>
  );
};
