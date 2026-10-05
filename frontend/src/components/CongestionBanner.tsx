import React from 'react';
import { AlertTriangle, ShieldCheck, AlertCircle, Flame, BellRing } from 'lucide-react';
import type { TelemetryData, CongestionLevel } from '../types/queue';

interface CongestionBannerProps {
  telemetry: TelemetryData | null;
}

export const CongestionBanner: React.FC<CongestionBannerProps> = ({ telemetry }) => {
  const level: CongestionLevel = telemetry?.congestion_level ?? 'NORMAL';

  const configMap = {
    NORMAL: {
      label: 'NORMAL CONGESTION',
      icon: ShieldCheck,
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      borderGlow: 'border-emerald-500/40 shadow-emerald-500/10',
      textColor: 'text-emerald-400',
      desc: 'Queue operating within normal capacity limits',
    },
    MODERATE: {
      label: 'MODERATE CONGESTION',
      icon: AlertCircle,
      badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      borderGlow: 'border-amber-500/40 shadow-amber-500/10',
      textColor: 'text-amber-400',
      desc: 'Waiting area load is increasing - monitor counter pacing',
    },
    HIGH: {
      label: 'HIGH CONGESTION',
      icon: AlertTriangle,
      badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      borderGlow: 'border-orange-500/50 shadow-orange-500/20',
      textColor: 'text-orange-400',
      desc: 'High crowd density detected in waiting area - consider opening auxiliary counter',
    },
    CRITICAL: {
      label: 'CRITICAL CONGESTION',
      icon: Flame,
      badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      borderGlow: 'border-rose-500/60 shadow-rose-500/20 animate-pulse',
      textColor: 'text-rose-400',
      desc: 'Severe bottleneck & excessive wait times predicted - immediate staff intervention required',
    },
  };

  const currentConfig = configMap[level];
  const IconComponent = currentConfig.icon;
  const waitingPeople = telemetry?.waiting_area_count ?? 0;
  const tokensWaiting = telemetry?.tokens_waiting ?? 0;
  const prediction = telemetry?.prediction;
  const alertMessage = telemetry?.alert_message;
  const isPredictive = prediction && prediction !== 'Queue operating normally';

  return (
    <div className={`rounded-xl bg-navy-900 border ${currentConfig.borderGlow} p-6 shadow-xl relative overflow-hidden transition-all duration-300`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Level Badge and Metrics */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-lg text-sm font-bold border flex items-center gap-2 ${currentConfig.badgeBg}`}>
              <IconComponent className="w-4 h-4" />
              <span>{currentConfig.label}</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Trend: <strong className="text-white">{telemetry?.queue_trend ?? 'STABLE'}</strong>
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2 font-mono">
              <span>{Math.max(waitingPeople, tokensWaiting)}</span>
              <span className="text-base font-normal text-slate-300">people currently waiting</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {currentConfig.desc}
            </p>
          </div>
        </div>

        {/* Right Side: Predictive Warning Box & Hardware Output Status */}
        <div className="flex flex-col gap-3 min-w-[280px]">
          {/* Predictive Banner Box */}
          <div className={`p-4 rounded-xl border ${
            isPredictive
              ? 'bg-orange-950/40 border-orange-500/40 text-orange-200 shadow-lg'
              : 'bg-navy-850 border-navy-700 text-slate-300'
          }`}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPredictive ? 'text-orange-400 animate-bounce' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {isPredictive ? prediction : 'Real-Time Prediction Status'}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {alertMessage || 'No immediate congestion surge anticipated in 5-min horizon'}
                </div>
              </div>
            </div>
          </div>

          {/* Hardware Output Indicators (ESP32 Ready) */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-navy-850 border border-navy-700 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-brand-cyan" />
              HARDWARE ALERT BUS:
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className={`w-2.5 h-2.5 rounded-full ${level === 'NORMAL' ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-slate-700'}`} title="Green LED" />
              <span className={`w-2.5 h-2.5 rounded-full ${level === 'MODERATE' ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-slate-700'}`} title="Yellow LED" />
              <span className={`w-2.5 h-2.5 rounded-full ${level === 'HIGH' ? 'bg-orange-400 ring-2 ring-orange-400/30' : 'bg-slate-700'}`} title="Orange LED" />
              <span className={`w-2.5 h-2.5 rounded-full ${level === 'CRITICAL' ? 'bg-rose-500 ring-2 ring-rose-500/40 animate-ping' : 'bg-slate-700'}`} title="Red LED" />
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${telemetry?.hardware_flags?.buzzer ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-500'}`}>
                {telemetry?.hardware_flags?.buzzer ? 'BUZZER ACTIVE' : 'BUZZER OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
