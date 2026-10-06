import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame } from 'lucide-react';
import type { CongestionLevel } from '../../types/queue';

interface StatusBadgeProps {
  level?: CongestionLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  level = 'NORMAL',
  size = 'md',
  showIcon = true,
}) => {
  const configs = {
    NORMAL: {
      label: 'Normal Flow',
      icon: ShieldCheck,
      classes: 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]',
      dotColor: 'bg-[#16A34A]',
    },
    MODERATE: {
      label: 'Moderate Traffic',
      icon: AlertCircle,
      classes: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      dotColor: 'bg-[#D97706]',
    },
    HIGH: {
      label: 'High Density',
      icon: AlertTriangle,
      classes: 'bg-[#FFEDD5] text-[#EA580C] border-[#FDBA74]',
      dotColor: 'bg-[#EA580C]',
    },
    CRITICAL: {
      label: 'Critical Surge',
      icon: Flame,
      classes: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
      dotColor: 'bg-[#DC2626]',
    },
  };

  const config = configs[level] || configs.NORMAL;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px] gap-1.5',
    md: 'px-3 py-1 text-xs gap-2',
    lg: 'px-4 py-1.5 text-sm font-bold gap-2.5',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold tracking-wide shadow-2xs ${sizeClasses} ${config.classes}`}
    >
      {showIcon ? (
        <Icon className={iconSizes} />
      ) : (
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};
