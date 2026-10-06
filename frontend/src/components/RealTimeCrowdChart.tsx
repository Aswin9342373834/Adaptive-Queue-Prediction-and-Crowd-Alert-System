import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { CrowdTrendPoint } from '../types/queue';

interface RealTimeCrowdChartProps {
  data: CrowdTrendPoint[];
  currentCount: number;
  peakCount: number;
  crowdStatus: string;
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-lg text-xs font-mono">
        <p className="text-[#64748B] font-bold mb-1.5">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <span style={{ color: entry.color }} className="font-semibold">
              {entry.name}:
            </span>
            <span className="font-black text-[#172033]">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const RealTimeCrowdChart: React.FC<RealTimeCrowdChartProps> = ({
  data,
  currentCount,
  peakCount,
  crowdStatus,
}) => {
  // Ensure we have at least baseline data points to render smoothly
  const chartPoints = data && data.length > 0 ? data : [
    { time: '10:00:00', count: currentCount || 0, waiting: 0, status: crowdStatus },
  ];

  const isHigh = crowdStatus === 'HIGH';
  const isModerate = crowdStatus === 'MODERATE';
  const strokeColor = isHigh ? '#DC2626' : isModerate ? '#D97706' : '#1769E0';

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
              Real-Time Crowd Trend
            </h3>
            <p className="text-xs text-[#64748B]">
              Continuous rolling 60-second window of camera-detected people density
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] font-bold">
            Live: <span className="text-[#1769E0]">{currentCount}</span> people
          </span>
          <span className="px-3 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] font-bold">
            Peak: <span className="text-[#D97706]">{peakCount}</span>
          </span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="crowdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#94A3B8"
              tick={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Area
              type="monotone"
              dataKey="count"
              name="People Detected"
              stroke={strokeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#crowdGradient)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="waiting"
              name="Waiting in Zone"
              stroke="#16A34A"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1769E0]" />
            <span>Actual Vision Count</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            <span>Waiting Area ROI</span>
          </span>
        </div>
        <span className="font-mono">Live 10Hz Feed &bull; 60 Samples</span>
      </div>
    </div>
  );
};
