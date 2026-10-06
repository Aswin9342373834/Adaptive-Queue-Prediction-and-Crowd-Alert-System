import React, { useState } from 'react';
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
import {
  TrendingUp,
  Users,
  Clock,
  Activity,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { MetricCard } from '../../components/common/MetricCard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-lg text-xs font-mono text-[#172033]">
        <p className="text-[#64748B] font-bold mb-1.5">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ManagerAnalyticsPage: React.FC = () => {
  const { history, telemetry } = useQueue();
  const [windowFilter, setWindowFilter] = useState<'live' | '15m' | '30m'>('live');

  const chartData = history.map((item) => {
    const d = new Date(item.timestamp * 1000);
    const timeLabel = d.toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Queue Intelligence & Traffic Analytics
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Real-time Poisson queue model, arrival pacing, and service performance telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['live', '15m', '30m'] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWindowFilter(w)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                windowFilter === w
                  ? 'bg-[#1769E0] text-white shadow-2xs'
                  : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              {w === 'live' ? 'Live Rolling' : `${w} Window`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Arrival Rate"
          value={telemetry ? `${telemetry.arrival_rate} /min` : '--'}
          subtitle="New customer arrival velocity"
          icon={ArrowUpRight}
          colorScheme="cyan"
        />
        <MetricCard
          title="Service Rate"
          value={telemetry ? `${telemetry.service_rate} /min` : '--'}
          subtitle="Counter resolution throughput"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <MetricCard
          title="Net Growth Rate"
          value={telemetry ? `${telemetry.queue_growth_rate > 0 ? '+' : ''}${telemetry.queue_growth_rate} /min` : '--'}
          subtitle="Arrivals minus completions"
          icon={TrendingUp}
          colorScheme={telemetry?.queue_growth_rate && telemetry.queue_growth_rate > 0 ? 'amber' : 'blue'}
        />
        <MetricCard
          title="Avg Service Pacing"
          value={telemetry?.average_service_display ?? '3:00 min'}
          subtitle="Rolling exponential average"
          icon={Clock}
          colorScheme="indigo"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Customer Volume & Queue Depth */}
        <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#16A34A]" />
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                Waiting Queue Depth Over Time
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">Live Window</span>
          </div>

          <div className="h-64 w-full">
            {chartData.length < 2 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#64748B] font-mono">
                Accumulating real-time data points from backend...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaWaiting" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="areaTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1769E0" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1769E0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="time" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="waiting_area"
                    name="Physical Waiting Area"
                    stroke="#16A34A"
                    strokeWidth={2}
                    fill="url(#areaWaiting)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens_waiting"
                    name="Active Queue Tokens"
                    stroke="#1769E0"
                    strokeWidth={2}
                    fill="url(#areaTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Arrival Rate vs Service Rate Throughput */}
        <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1769E0]" />
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                Arrival Pacing vs Counter Service Rate
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">Throughput Rate</span>
          </div>

          <div className="h-64 w-full">
            {chartData.length < 2 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#64748B] font-mono">
                Accumulating real-time telemetry...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="time" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="arrival_rate"
                    name="Arrivals / min"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="service_rate"
                    name="Service / min"
                    stroke="#1769E0"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Analytical Insights Card */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider mb-4">
          Analytical Recommendations & Queue Stability
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-bold text-[#1769E0] uppercase block mb-1">Pacing Balance</span>
            <p className="text-[#64748B] font-medium">
              When arrival rate ({telemetry?.arrival_rate ?? 0}/min) is below service rate ({telemetry?.service_rate ?? 0}/min), queue stability is maintained without counter overloads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-bold text-[#16A34A] uppercase block mb-1">Service SLA Compliance</span>
            <p className="text-[#64748B] font-medium">
              Average waiting time is currently ~{Math.round(telemetry?.max_wait_minutes ?? 5)} minutes. Target SLA is under 15 minutes per customer.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-bold text-[#D97706] uppercase block mb-1">Auxiliary Threshold</span>
            <p className="text-[#64748B] font-medium">
              If waiting tokens exceed 10 or growth rate crosses +1.5/min, system triggers High Alert on ESP32 alert bus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
