import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Users, Clock, Activity } from 'lucide-react';
import type { TelemetryData } from '../types/queue';

interface AnalyticsChartsProps {
  history: TelemetryData[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ history }) => {
  const chartData = history.map((item) => {
    const d = new Date(item.timestamp * 1000);
    const timeLabel = d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      time: timeLabel,
      waiting_area: item.waiting_area_count,
      tokens_waiting: item.tokens_waiting,
      people_detected: item.people_detected,
      growth_rate: item.queue_growth_rate,
      arrival_rate: item.arrival_rate,
      service_rate: item.service_rate,
      max_wait: item.max_wait_minutes,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-navy-900 border border-navy-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <p className="text-slate-400 font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-3">
              <span>{entry.name}:</span>
              <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Waiting People Over Time */}
      <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Waiting People Over Time
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Live Telemetry</span>
        </div>
        <div className="h-56 w-full">
          {chartData.length < 2 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Accumulating real-time data points...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWaiting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E676" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00E676" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3A86FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3A86FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="waiting_area" name="Waiting Area ROI" stroke="#00E676" strokeWidth={2} fillOpacity={1} fill="url(#colorWaiting)" />
                <Area type="monotone" dataKey="tokens_waiting" name="Tokens Waiting" stroke="#3A86FF" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Queue Growth Rate */}
      <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Queue Growth Rate (ΔPeople / Min)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Slope Velocity</span>
        </div>
        <div className="h-56 w-full">
          {chartData.length < 2 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Accumulating real-time data points...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="growth_rate" name="Growth Rate (/min)" stroke="#FFB703" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 3: Arrival Rate vs Service Rate */}
      <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-cyan" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Arrival Rate vs Service Rate
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Flow Equilibrium</span>
        </div>
        <div className="h-56 w-full">
          {chartData.length < 2 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Accumulating real-time data points...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="arrival_rate" name="Arrival Rate (λ)" stroke="#00F0FF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="service_rate" name="Service Rate (μ)" stroke="#3A86FF" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 4: Estimated Waiting Time */}
      <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Max Estimated Waiting Time (Minutes)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Dynamic Horizon</span>
        </div>
        <div className="h-56 w-full">
          {chartData.length < 2 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Accumulating real-time data points...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="max_wait" name="Max Wait (Minutes)" stroke="#C084FC" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
