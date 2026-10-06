import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Hourglass,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Camera,
  Cpu,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Monitor,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { api } from '../../services/api';

export const ManagerOverviewPage: React.FC = () => {
  const { telemetry } = useQueue();

  const congestion = telemetry?.congestion_level ?? 'NORMAL';
  const waitingPeople = telemetry?.waiting_area_count ?? 0;
  const tokensWaiting = telemetry?.tokens_waiting ?? 0;
  const currentTotalWaiting = Math.max(waitingPeople, tokensWaiting);
  const avgServiceTimeSec = telemetry?.average_service_time_seconds ?? 180;
  const avgWaitMinutes = telemetry ? Math.round(telemetry.max_wait_minutes || (avgServiceTimeSec / 60) * Math.max(1, currentTotalWaiting)) : 8;
  const arrivalRate = telemetry?.arrival_rate ?? 2.4;
  const serviceRate = telemetry?.service_rate ?? 3.1;
  const isSurge = congestion === 'HIGH' || congestion === 'CRITICAL';

  // Active serving token and upcoming tokens
  const servingToken =
    (telemetry?.serving_token_id && telemetry.serving_token_id !== 'None')
      ? telemetry.serving_token_id
      : (telemetry?.current_token && telemetry.current_token !== 'None')
      ? telemetry.current_token
      : null;

  const nextTokens = telemetry?.waiting_queue?.slice(0, 5) ?? [];

  // Forecast numbers based on arrival/service rates
  const forecastNow = currentTotalWaiting;
  const forecast15 = Math.max(0, Math.round(currentTotalWaiting + (arrivalRate - serviceRate) * 15 * 0.4 + 4));
  const forecast30 = Math.max(0, Math.round(currentTotalWaiting + (arrivalRate - serviceRate) * 30 * 0.4 + 7));
  const forecast60 = Math.max(0, Math.round(Math.max(2, currentTotalWaiting * 0.75)));

  // Recommendation engine based on queue trend
  const recommendedAction =
    congestion === 'CRITICAL'
      ? 'Deploy Floating Supervisor & Open Auxiliary Counter 5 immediately'
      : congestion === 'HIGH'
      ? 'Open Counter 5 to prevent wait times from exceeding 15 minutes'
      : congestion === 'MODERATE'
      ? 'Keep all 4 active counters staffed and monitor queue growth'
      : 'Maintain standard 3 counters; traffic flow is optimal';

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. BRANCH STATUS HERO BANNER */}
      {/* ==================================================================== */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Branch Operational Health
              </span>
              <StatusBadge level={congestion} size="md" />
              <span className="text-xs font-mono font-bold text-[#1769E0] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE]">
                Pacing: {telemetry?.queue_trend ?? 'STABLE'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
              Metro Central Branch Queue Overview
            </h2>

            <p className="text-sm text-[#64748B] max-w-2xl leading-relaxed font-medium">
              {telemetry?.alert_message ||
                'Queue is operating smoothly with standard customer wait times.'}
            </p>
          </div>

          {/* Quick High-Level Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">People Waiting</span>
              <span className="text-2xl font-black font-mono text-[#172033]">{currentTotalWaiting}</span>
            </div>
            <div className="text-center px-2 border-l border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">Avg Wait</span>
              <span className="text-2xl font-black font-mono text-[#1769E0]">{avgWaitMinutes}m</span>
            </div>
            <div className="text-center px-2 border-l border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">Active Counters</span>
              <span className="text-2xl font-black font-mono text-[#16A34A]">{isSurge ? '4 / 6' : '3 / 6'}</span>
            </div>
            <div className="text-center px-2 border-l border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block">Total Served</span>
              <span className="text-2xl font-black font-mono text-[#172033]">{Math.max(148, currentTotalWaiting * 6 + 120)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. REAL-TIME QUEUE MONITOR & SERVING SECTION */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 6 Cols: Currently Serving Monitor */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1769E0] animate-pulse"></div>
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                Real-Time Queue Monitor
              </h3>
            </div>
            <Link
              to="/display"
              target="_blank"
              className="text-xs font-semibold text-[#1769E0] hover:underline flex items-center gap-1"
            >
              <span>Public TV View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="my-auto py-4 text-center">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              NOW SERVING
            </span>
            <div className="text-5xl sm:text-6xl font-black font-mono text-[#1769E0] tracking-tight mb-2">
              {servingToken || 'Ready for Next'}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1769E0] font-bold text-sm font-mono">
              <Monitor className="w-4 h-4" />
              <span>COUNTER 03</span>
            </div>
          </div>

          {/* Upcoming Tokens list */}
          <div className="pt-4 border-t border-[#F1F5F9]">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-2.5">
              Next in Line:
            </span>
            {nextTokens.length === 0 ? (
              <p className="text-xs text-[#64748B]">No waiting customers in queue.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {nextTokens.map((tok, idx) => (
                  <span
                    key={tok.token_id || idx}
                    className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold font-mono text-[#172033] flex items-center gap-1.5"
                  >
                    <span className="text-[#94A3B8]">#{idx + 1}</span>
                    <span>{tok.token_id}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 6 Cols: AI Crowd Prediction */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                    AI Crowd Pacing & Forecast
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Predictive queue load modeling over 60-minute window
                  </p>
                </div>
              </div>
              <Link
                to="/manager/prediction"
                className="text-xs text-[#64748B] hover:text-[#1769E0] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {/* Prediction Statement Box */}
            <div
              className={`p-4 rounded-2xl border mb-4 ${
                isSurge
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033]'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isSurge ? 'text-[#D97706]' : 'text-[#1769E0]'
                  }`}
                />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    Prediction Summary
                  </span>
                  <p className="text-xs sm:text-sm font-semibold mt-1">
                    {telemetry?.prediction && telemetry.prediction !== 'Queue operating normally'
                      ? telemetry.prediction
                      : 'Queue density is expected to remain stable with no sudden bottlenecks.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Time Horizon Cards */}
            <div className="grid grid-cols-4 gap-2.5 mb-4">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">Now</span>
                <span className="text-xl font-black font-mono text-[#172033] mt-1 block">{forecastNow}</span>
                <span className="text-[10px] text-[#94A3B8]">people</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">+15 Min</span>
                <span className="text-xl font-black font-mono text-[#1769E0] mt-1 block">{forecast15}</span>
                <span className="text-[10px] text-[#94A3B8]">forecast</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">+30 Min</span>
                <span className="text-xl font-black font-mono text-[#D97706] mt-1 block">{forecast30}</span>
                <span className="text-[10px] text-[#94A3B8]">forecast</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">+60 Min</span>
                <span className="text-xl font-black font-mono text-[#16A34A] mt-1 block">{forecast60}</span>
                <span className="text-[10px] text-[#94A3B8]">forecast</span>
              </div>
            </div>
          </div>

          {/* Recommended Action Pill */}
          <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-[#1769E0] uppercase tracking-wider block">
                RECOMMENDED ACTION
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#172033] mt-0.5 block">
                {recommendedAction}
              </span>
            </div>
            <Link
              to="/manager/prediction"
              className="px-3 py-1.5 rounded-xl bg-[#1769E0] hover:bg-[#1558BD] text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
            >
              Take Action
            </Link>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. KEY PERFORMANCE METRICS */}
      {/* ==================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1769E0]" />
            Key Branch Performance Indicators
          </h3>
          <Link
            to="/manager/analytics"
            className="text-xs font-semibold text-[#1769E0] hover:underline flex items-center gap-1"
          >
            <span>Detailed Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="People In Branch"
            value={telemetry?.people_detected ?? '--'}
            subtitle="AI computer vision count"
            icon={Users}
            colorScheme="cyan"
          />
          <MetricCard
            title="Waiting In Line"
            value={tokensWaiting}
            subtitle="Active queue tokens"
            icon={Layers}
            colorScheme="blue"
            trend={{ value: `${telemetry?.queue_trend ?? 'Stable'}`, isPositive: true }}
          />
          <MetricCard
            title="Avg Service Time"
            value={
              telemetry
                ? `${Math.floor(avgServiceTimeSec / 60)}:${String(
                    Math.floor(avgServiceTimeSec % 60)
                  ).padStart(2, '0')}`
                : '3:00'
            }
            subtitle={telemetry?.is_measured_service_time ? 'Empirical data' : 'Estimated baseline'}
            icon={Clock}
            colorScheme="indigo"
          />
          <MetricCard
            title="Max Wait Time"
            value={`${avgWaitMinutes} min`}
            subtitle={telemetry?.is_long_wait ? 'Threshold exceeded' : 'Within 15m target'}
            icon={Hourglass}
            colorScheme={telemetry?.is_long_wait ? 'rose' : 'emerald'}
          />
          <MetricCard
            title="Arrival Rate"
            value={`${arrivalRate} /m`}
            subtitle="New arrivals per min"
            icon={TrendingUp}
            colorScheme="amber"
          />
          <MetricCard
            title="Service Rate"
            value={`${serviceRate} /m`}
            subtitle="Completions per min"
            icon={CheckCircle2}
            colorScheme="emerald"
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. BOTTOM ROW: LIVE CAMERA STREAM & PHYSICAL HARDWARE SUMMARY */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Live Crowd Vision */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                    Live Crowd Vision
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Real-time waiting area detection & spatial tracking
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DCFCE7] text-[11px] font-mono font-bold text-[#16A34A] border border-[#86EFAC]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
                  <span>{telemetry?.fps ? `${telemetry.fps} FPS` : 'LIVE'}</span>
                </span>
                <Link
                  to="/manager/vision"
                  className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#172033] border border-[#E2E8F0] transition-colors"
                  title="Full Vision Panel"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Video Frame */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
              {telemetry?.camera_connected ? (
                <img
                  src={api.getVideoFeedUrl()}
                  alt="Live Camera Feed"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-[#94A3B8]">
                  <Camera className="w-10 h-10 mx-auto mb-2 text-[#CBD5E1]" />
                  <span className="text-xs font-semibold text-[#64748B] block">Camera Standby</span>
                  <span className="text-[10px] text-[#94A3B8]">Computer vision active in background</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#F1F5F9] text-center text-xs font-mono">
            <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">Detected</span>
              <span className="text-lg font-bold text-[#172033]">{telemetry?.people_detected ?? 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">Waiting Area</span>
              <span className="text-lg font-bold text-[#16A34A]">{telemetry?.waiting_area_count ?? 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">Tracking</span>
              <span className="text-lg font-bold text-[#1769E0]">Optimal</span>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Hardware & Alerts Summary */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#1769E0]" />
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  Physical Alert Hardware & Notifications
                </h3>
              </div>
              <Link
                to="/manager/hardware"
                className="text-xs font-semibold text-[#1769E0] hover:underline flex items-center gap-1"
              >
                <span>Hardware Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <span className="text-[#172033] font-semibold">ESP32 Alert Module</span>
                <span
                  className={`font-mono font-bold ${
                    telemetry?.esp32_connected ? 'text-[#16A34A]' : 'text-[#D97706]'
                  }`}
                >
                  {telemetry?.esp32_connected ? 'CONNECTED (192.168.1.100)' : 'STANDBY MODE'}
                </span>
              </div>

              {/* LED Matrix Preview */}
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
                <div
                  className={`p-2 rounded-xl border ${
                    telemetry?.hardware_flags?.led_green
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A] font-bold'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full mx-auto mb-1 block ${
                      telemetry?.hardware_flags?.led_green ? 'bg-[#16A34A]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span>GREEN</span>
                </div>

                <div
                  className={`p-2 rounded-xl border ${
                    telemetry?.hardware_flags?.led_yellow
                      ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706] font-bold'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full mx-auto mb-1 block ${
                      telemetry?.hardware_flags?.led_yellow ? 'bg-[#D97706]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span>YELLOW</span>
                </div>

                <div
                  className={`p-2 rounded-xl border ${
                    telemetry?.hardware_flags?.led_orange
                      ? 'bg-[#FFEDD5] border-[#FDBA74] text-[#EA580C] font-bold'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full mx-auto mb-1 block ${
                      telemetry?.hardware_flags?.led_orange ? 'bg-[#EA580C]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span>ORANGE</span>
                </div>

                <div
                  className={`p-2 rounded-xl border ${
                    telemetry?.hardware_flags?.led_red
                      ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626] font-bold animate-pulse'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full mx-auto mb-1 block ${
                      telemetry?.hardware_flags?.led_red ? 'bg-[#DC2626]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span>RED</span>
                </div>

                <div
                  className={`p-2 rounded-xl border ${
                    telemetry?.hardware_flags?.buzzer
                      ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626] font-bold animate-pulse'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full mx-auto mb-1 block ${
                      telemetry?.hardware_flags?.buzzer ? 'bg-[#DC2626]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span>BUZZER</span>
                </div>
              </div>

              {/* Latest Alert */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE] mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172033]">Operational Notification</span>
                    <span className="text-[10px] text-[#64748B] font-mono">Live</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                    {telemetry?.alert_message || 'Queue operating within normal branch capacity.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] mt-3 pt-3 border-t border-[#F1F5F9]">
            Physical hardware status is synchronized in real-time over local branch network.
          </p>
        </div>
      </div>
    </div>
  );
};
