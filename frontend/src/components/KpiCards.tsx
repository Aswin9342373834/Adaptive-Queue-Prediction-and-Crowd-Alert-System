import React from 'react';
import { Users, UserCheck, Ticket, UserPlus, Clock, Hourglass, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { TelemetryData } from '../types/queue';

interface KpiCardsProps {
  telemetry: TelemetryData | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ telemetry }) => {
  const cards = [
    {
      title: 'PEOPLE DETECTED',
      value: telemetry?.people_detected ?? '--',
      subtitle: `${telemetry?.active_tracks ?? 0} active spatial tracks`,
      icon: Users,
      color: 'text-brand-cyan',
      borderColor: 'border-brand-cyan/20',
      bgGlow: 'from-brand-cyan/10 to-transparent',
    },
    {
      title: 'WAITING AREA',
      value: telemetry?.waiting_area_count ?? '--',
      subtitle: 'Physically inside ROI box',
      icon: UserCheck,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      bgGlow: 'from-emerald-500/10 to-transparent',
    },
    {
      title: 'TOKENS WAITING',
      value: telemetry?.tokens_waiting ?? '--',
      subtitle: 'Queued in digital engine',
      icon: Ticket,
      color: 'text-brand-blue',
      borderColor: 'border-brand-blue/20',
      bgGlow: 'from-brand-blue/10 to-transparent',
    },
    {
      title: 'CURRENT TOKEN',
      value: telemetry?.serving_token_id !== 'None' ? telemetry?.serving_token_id : (telemetry?.current_token !== 'None' ? telemetry?.current_token : '--'),
      subtitle: telemetry?.serving_token_id !== 'None' ? 'Active at counter' : 'Awaiting customer',
      icon: UserPlus,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      bgGlow: 'from-amber-500/10 to-transparent',
    },
    {
      title: 'AVG SERVICE TIME',
      value: telemetry ? (telemetry.is_measured_service_time ? `${Math.floor(telemetry.average_service_time_seconds / 60)}:${String(Math.floor(telemetry.average_service_time_seconds % 60)).padStart(2, '0')}` : `${Math.floor(telemetry.average_service_time_seconds / 60)}:00`) : '--:--',
      subtitle: telemetry?.is_measured_service_time ? 'Measured session empirical data' : 'Estimated baseline bootstrap',
      icon: Clock,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/20',
      bgGlow: 'from-indigo-500/10 to-transparent',
    },
    {
      title: 'MAX WAIT TIME',
      value: telemetry ? `${telemetry.max_wait_minutes} min` : '-- min',
      subtitle: telemetry?.is_long_wait ? '⚠ Exceeds 20m threshold' : 'Latest queue position wait',
      icon: Hourglass,
      color: telemetry?.is_long_wait ? 'text-rose-400' : 'text-purple-400',
      borderColor: telemetry?.is_long_wait ? 'border-rose-500/40' : 'border-purple-500/20',
      bgGlow: telemetry?.is_long_wait ? 'from-rose-500/10 to-transparent' : 'from-purple-500/10 to-transparent',
    },
    {
      title: 'ARRIVAL RATE',
      value: telemetry ? `${telemetry.arrival_rate} /min` : '-- /min',
      subtitle: 'New unique arrivals / min',
      icon: TrendingUp,
      color: 'text-teal-400',
      borderColor: 'border-teal-500/20',
      bgGlow: 'from-teal-500/10 to-transparent',
    },
    {
      title: 'SERVICE RATE',
      value: telemetry ? `${telemetry.service_rate} /min` : '-- /min',
      subtitle: 'Completions / session min',
      icon: CheckCircle2,
      color: 'text-sky-400',
      borderColor: 'border-sky-500/20',
      bgGlow: 'from-sky-500/10 to-transparent',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl bg-navy-900 border ${card.borderColor} p-4 transition-all duration-300 hover:border-navy-600 hover:shadow-lg`}
          >
            <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${card.bgGlow} rounded-full blur-xl pointer-events-none`} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-navy-800 ${card.color}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {card.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
