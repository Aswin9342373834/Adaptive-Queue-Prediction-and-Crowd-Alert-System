import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Camera,
  UserCheck,
  ListOrdered,
  Tv,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export const MobileNav: React.FC = () => {
  const { role } = useAuth();
  const { telemetry } = useQueue();

  if (role === 'manager') {
    const managerItems = [
      { to: '/manager/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/manager/analytics', label: 'Analytics', icon: TrendingUp },
      { to: '/manager/prediction', label: 'Forecast', icon: Sparkles },
      { to: '/manager/vision', label: 'Vision', icon: Camera },
      { to: '/manager/hardware', label: 'Hardware', icon: Cpu },
    ];

    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] px-2 py-2 flex items-center justify-around shadow-lg">
        {managerItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                  isActive
                    ? 'text-[#1769E0] bg-[#EFF6FF]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  if (role === 'staff') {
    const staffItems = [
      { to: '/staff/dashboard', label: 'Service', icon: UserCheck },
      {
        to: '/staff/queue',
        label: 'Queue',
        icon: ListOrdered,
        badge: telemetry?.tokens_waiting,
      },
      { to: '/display', label: 'TV Display', icon: Tv, external: true },
    ];

    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] px-2 py-2 flex items-center justify-around shadow-lg">
        {staffItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              target={item.external ? '_blank' : undefined}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-[11px] font-semibold transition-all relative ${
                  isActive && !item.external
                    ? 'text-[#1769E0] bg-[#EFF6FF]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-[#1769E0] text-white text-[9px] font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  if (role === 'receptionist') {
    const receptionItems = [
      { to: '/reception/dashboard', label: 'Register', icon: UserCheck },
      { to: '/display', label: 'TV Display', icon: Tv, external: true },
    ];

    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] px-4 py-2 flex items-center justify-around shadow-lg">
        {receptionItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              target={item.external ? '_blank' : undefined}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-6 rounded-xl text-[11px] font-semibold transition-all ${
                  isActive && !item.external
                    ? 'text-[#1769E0] bg-[#EFF6FF]'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  return null;
};
