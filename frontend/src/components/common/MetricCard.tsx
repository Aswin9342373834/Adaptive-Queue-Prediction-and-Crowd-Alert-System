import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'indigo';
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue',
  badge,
  trend,
}) => {
  const colorMap = {
    blue: {
      text: 'text-[#1769E0]',
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#BFDBFE]',
      valueColor: 'text-[#172033]',
    },
    cyan: {
      text: 'text-[#0284C7]',
      bg: 'bg-[#E0F2FE]',
      border: 'border-[#BAE6FD]',
      valueColor: 'text-[#172033]',
    },
    emerald: {
      text: 'text-[#16A34A]',
      bg: 'bg-[#DCFCE7]',
      border: 'border-[#86EFAC]',
      valueColor: 'text-[#16A34A]',
    },
    amber: {
      text: 'text-[#D97706]',
      bg: 'bg-[#FEF3C7]',
      border: 'border-[#FDE68A]',
      valueColor: 'text-[#1769E0]',
    },
    rose: {
      text: 'text-[#DC2626]',
      bg: 'bg-[#FEE2E2]',
      border: 'border-[#FCA5A5]',
      valueColor: 'text-[#DC2626]',
    },
    purple: {
      text: 'text-[#7C3AED]',
      bg: 'bg-[#F3E8FF]',
      border: 'border-[#DDD6FE]',
      valueColor: 'text-[#172033]',
    },
    indigo: {
      text: 'text-[#4F46E5]',
      bg: 'bg-[#EEF2FF]',
      border: 'border-[#C7D2FE]',
      valueColor: 'text-[#172033]',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
              {badge}
            </span>
          )}
          <div className={`p-2 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Value */}
      <div className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${scheme.valueColor}`}>
        {value}
      </div>

      {/* Footer / Subtitle / Trend */}
      <div className="mt-3 pt-2 border-t border-[#F8FAFC] flex items-center justify-between gap-2 text-xs">
        {subtitle && (
          <p className="text-[#64748B] truncate text-[11px] font-medium">{subtitle}</p>
        )}
        {trend && (
          <span
            className={`font-mono text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-full ${
              trend.isNeutral
                ? 'bg-[#F1F5F9] text-[#64748B]'
                : trend.isPositive
                ? 'bg-[#DCFCE7] text-[#16A34A]'
                : 'bg-[#FEE2E2] text-[#DC2626]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
