import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, ShieldCheck, AlertCircle, Flame, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { AlertEvent, CongestionLevel } from '../types/queue';

interface AlertsPanelProps {
  currentAlertMessage?: string;
  currentLevel?: CongestionLevel;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = () => {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts();
      if (res.alert_log) {
        setAlerts(res.alert_log.slice().reverse()); // Newest first
      }
    } catch (e) {
      console.error('Error fetching alerts log:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const getBadge = (lvl: CongestionLevel) => {
    switch (lvl) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          icon: Flame,
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          icon: AlertTriangle,
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: AlertCircle,
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: ShieldCheck,
        };
    }
  };

  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Deduplicated Alert Log
          </h3>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white transition-colors border border-navy-700"
          title="Refresh Alerts"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            No historical alert transitions recorded.
          </div>
        ) : (
          alerts.map((item, idx) => {
            const badge = getBadge(item.level);
            const IconComponent = badge.icon;
            const dateStr = new Date(item.timestamp * 1000).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-navy-850 border border-navy-800 hover:border-navy-700 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-md border mt-0.5 ${badge.bg}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.level}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{dateStr}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{item.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
