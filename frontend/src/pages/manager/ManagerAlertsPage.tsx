import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  Flame,
  RefreshCw,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import type { AlertEvent, CongestionLevel } from '../../types/queue';

export const ManagerAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts();
      if (res.alert_log) {
        setAlerts(res.alert_log.slice().reverse());
      }
    } catch (e) {
      console.error('Error fetching alerts log:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const getBadge = (lvl: CongestionLevel) => {
    switch (lvl) {
      case 'CRITICAL':
        return {
          bg: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
          icon: Flame,
          title: 'Critical Congestion Warning',
        };
      case 'HIGH':
        return {
          bg: 'bg-[#FFEDD5] text-[#EA580C] border-[#FDBA74]',
          icon: AlertTriangle,
          title: 'High Density Surge',
        };
      case 'MODERATE':
        return {
          bg: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
          icon: AlertCircle,
          title: 'Moderate Queue Load',
        };
      default:
        return {
          bg: 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]',
          icon: ShieldCheck,
          title: 'Standard Normal Pacing',
        };
    }
  };

  const filteredAlerts =
    filterLevel === 'ALL' ? alerts : alerts.filter((a) => a.level === filterLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
              <Bell className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
              Alerts & Notifications
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Historical System Alert Log
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Deduplicated log of queue congestion state shifts, wait SLA warnings, and hardware alerts
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider mr-2 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#1769E0]" />
          <span>Filter:</span>
        </span>
        {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'NORMAL'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              filterLevel === lvl
                ? 'bg-[#1769E0] text-white shadow-2xs'
                : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Alert Cards List */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center text-[#64748B] font-medium text-sm">
              <CheckCircle2 className="w-12 h-12 text-[#16A34A] mx-auto mb-2" />
              <p className="text-[#172033] font-bold">No alert events recorded for this filter level.</p>
              <p className="text-xs text-[#64748B] mt-1 font-medium">Branch operates within standard SLA thresholds.</p>
            </div>
          ) : (
            filteredAlerts.map((item, idx) => {
              const badge = getBadge(item.level);
              const Icon = badge.icon;
              const dateObj = new Date(item.timestamp * 1000);
              const timeStr = dateObj.toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const dateStr = dateObj.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl border mt-0.5 ${badge.bg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[#172033]">{badge.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.bg}`}>
                          {item.level}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] font-medium leading-relaxed max-w-2xl">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-xs font-mono text-[#64748B] pt-2 sm:pt-0 border-t sm:border-0 border-[#E2E8F0]">
                    <span className="font-bold text-[#172033]">{timeStr}</span>
                    <span className="text-[10px] text-[#94A3B8]">{dateStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
