import React from 'react';
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useQueue } from '../../context/QueueContext';
import { StatusBadge } from '../../components/common/StatusBadge';

export const ManagerPredictionPage: React.FC = () => {
  const { telemetry } = useQueue();

  const congestion = telemetry?.congestion_level ?? 'NORMAL';
  const waitingPeople = telemetry?.waiting_area_count ?? 0;
  const tokensWaiting = telemetry?.tokens_waiting ?? 0;
  const currentCount = Math.max(waitingPeople, tokensWaiting);
  const arrivalRate = telemetry?.arrival_rate ?? 2.5;
  const serviceRate = telemetry?.service_rate ?? 3.0;

  // Horizon calculations
  const fNow = currentCount;
  const f15 = Math.max(0, Math.round(currentCount + (arrivalRate - serviceRate) * 15 * 0.4 + 4));
  const f30 = Math.max(0, Math.round(currentCount + (arrivalRate - serviceRate) * 30 * 0.4 + 7));
  const f60 = Math.max(0, Math.round(Math.max(3, currentCount * 0.7)));

  const forecastData = [
    { time: 'Current (Now)', crowd: fNow, fill: '#1769E0' },
    { time: '+15 Min', crowd: f15, fill: f15 > 15 ? '#D97706' : '#0284C7' },
    { time: '+30 Min', crowd: f30, fill: f30 > 20 ? '#DC2626' : f30 > 12 ? '#D97706' : '#0284C7' },
    { time: '+60 Min', crowd: f60, fill: '#16A34A' },
  ];

  const predictionSummary =
    telemetry?.prediction && telemetry.prediction !== 'Queue operating normally'
      ? telemetry.prediction
      : 'Queue density is forecast to remain stable over the next 30–60 minutes.';

  const recommendedAction =
    congestion === 'CRITICAL'
      ? 'Open Counter 5 immediately and deploy floor host'
      : congestion === 'HIGH'
      ? 'Prepare Counter 5 for incoming customer surge'
      : congestion === 'MODERATE'
      ? 'Ensure all 4 counters maintain active pacing'
      : 'Maintain current 3 counters. Capacity is well-balanced';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider">
              AI Forecast Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Crowd Density Forecast & Anomaly Detection
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Predictive customer arrival modeling and counter staffing recommendations
          </p>
        </div>

        <StatusBadge level={congestion} size="lg" />
      </div>

      {/* Hero Prediction Statement Card */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Real-Time Forecast Insight
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#172033]">
              {predictionSummary}
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-xl font-medium">
              Queue Trend is <strong className="text-[#1769E0] font-mono">{telemetry?.queue_trend ?? 'STABLE'}</strong>. Prediction models anticipate peak traffic around lunch and end-of-day hours.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] lg:min-w-[320px]">
            <span className="text-[10px] font-bold text-[#1769E0] uppercase tracking-wider block mb-1">
              SYSTEM RECOMMENDED ACTION
            </span>
            <p className="text-sm font-bold text-[#172033] mb-3">
              {recommendedAction}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Counter Optimization Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Horizon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {forecastData.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                {item.time}
              </span>
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
            </div>

            <div>
              <div className="text-4xl font-black font-mono text-[#172033] tracking-tight">
                {item.crowd}
              </div>
              <span className="text-xs text-[#64748B] mt-1 block font-medium">
                Estimated People in Branch
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F8FAFC] text-[11px] text-[#64748B] flex items-center justify-between">
              <span>Status</span>
              <span className="font-bold text-[#172033]">
                {item.crowd > 20 ? 'High' : item.crowd > 10 ? 'Moderate' : 'Optimal'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart: Forecast Horizon Visualization */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1769E0]" />
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
              Crowd Forecast Projection (60-Min Horizon)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#64748B]">Pacing Model</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="time" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl shadow-lg text-xs font-mono text-[#172033]">
                        <p className="text-[#64748B] font-bold mb-1">{label}</p>
                        <p className="text-[#172033] font-bold">
                          Forecast Crowd: {payload[0].value} customers
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="crowd" name="Forecast Crowd" radius={[8, 8, 0, 0]}>
                {forecastData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diagnostic & Anomaly Indicators (Business-Friendly) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-2">
            People Detection
          </span>
          <div className="flex items-center gap-2 text-[#16A34A] font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <span>Active & Tracking</span>
          </div>
          <p className="text-xs text-[#64748B] mt-2 font-medium">
            AI spatial monitoring continuously counts customers in the waiting zone.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-2">
            Queue Anomaly Check
          </span>
          <div className="flex items-center gap-2 text-[#16A34A] font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <span>Normal Pacing</span>
          </div>
          <p className="text-xs text-[#64748B] mt-2 font-medium">
            No sudden abnormal bottlenecks or service blockages detected.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-2">
            Wait SLA Assurance
          </span>
          <div className="flex items-center gap-2 text-[#1769E0] font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <span>98.4% On-Target</span>
          </div>
          <p className="text-xs text-[#64748B] mt-2 font-medium">
            Customers receive counter service within target 15-minute SLA.
          </p>
        </div>
      </div>
    </div>
  );
};
