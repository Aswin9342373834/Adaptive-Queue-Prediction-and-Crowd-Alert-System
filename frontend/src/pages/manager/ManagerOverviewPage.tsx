import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Layers,
  Activity,
  TrendingUp,
  ExternalLink,
  Monitor,
  Building,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { MetricCard } from '../../components/common/MetricCard';
import { SystemStatusBar } from '../../components/SystemStatusBar';
import { LiveCrowdMonitor } from '../../components/LiveCrowdMonitor';
import { CrowdAnalyticsCorrelation } from '../../components/CrowdAnalyticsCorrelation';
import { RealTimeCrowdChart } from '../../components/RealTimeCrowdChart';
import { ESP32ManagerPanel } from '../../components/ESP32ManagerPanel';
import { CrowdAlertRecommendation } from '../../components/CrowdAlertRecommendation';
import { DownloadableReportSection } from '../../components/DownloadableReportSection';
import { api } from '../../services/api';

export const ManagerOverviewPage: React.FC = () => {
  const { telemetry, isConnected: wsConnected } = useQueue();
  const [backendHealthy, setBackendHealthy] = useState(true);

  // Periodic health ping for backend connection state
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getStatus();
        setBackendHealthy(true);
      } catch {
        setBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const peopleCount = telemetry?.people_detected ?? 0;
  const waitingTokens = telemetry?.tokens_waiting ?? 0;
  const waitingAreaCount = telemetry?.waiting_area_count ?? 0;
  const effectiveWaiting = Math.max(waitingTokens, waitingAreaCount);

  const avgServiceSec = telemetry?.average_service_time_seconds ?? 180;
  const avgWaitMin = Math.round(telemetry?.max_wait_minutes ?? (avgServiceSec / 60) * Math.max(1, effectiveWaiting));

  const counters = telemetry?.counters ?? [];
  const activeCountersCount = counters.filter((c) => c.active).length;
  const totalCountersCount = counters.length || 5;

  const crowdStatus = telemetry?.crowd_status || 'NORMAL';
  const peakCrowd = telemetry?.peak_crowd ?? peopleCount;
  const cameraConnected = !!telemetry?.camera_connected;
  const yoloActive = !!telemetry?.yolo_running;
  const esp32Connected = !!telemetry?.esp32_connected;
  const lastDetectionTime = telemetry?.last_detection_time_str || '--';
  const chartHistory = telemetry?.chart_history || [];

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* HEADER: Smart Bank Manager Dashboard + Live Status Bar */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <Building className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider">
              Smart Bank &bull; Manager Control Center
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
            Metro Central Branch Operations & Crowd Intelligence
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Real-time computer vision detection, crowd flow pacing, counter telemetry, and ESP32 hardware gateway
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/display"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>Public TV View</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#1769E0]" />
          </Link>
        </div>
      </div>

      {/* Persistent System Status Bar (Section 16) */}
      <SystemStatusBar
        backendConnected={backendHealthy}
        cameraConnected={cameraConnected}
        yoloActive={yoloActive}
        esp32Connected={esp32Connected}
        websocketConnected={wsConnected}
      />

      {/* ==================================================================== */}
      {/* ROW 1: KEY PERFORMANCE INDICATORS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Crowd"
          value={cameraConnected ? peopleCount : 0}
          subtitle={`Density: ${crowdStatus}`}
          icon={Users}
          colorScheme={crowdStatus === 'HIGH' ? 'rose' : crowdStatus === 'MODERATE' ? 'amber' : 'cyan'}
          trend={{ value: `${crowdStatus}`, isPositive: crowdStatus === 'NORMAL' }}
        />

        <MetricCard
          title="Waiting Queue"
          value={waitingTokens}
          subtitle={`${waitingAreaCount} in waiting zone`}
          icon={Layers}
          colorScheme="blue"
          trend={{ value: `${telemetry?.queue_trend ?? 'STABLE'}`, isPositive: true }}
        />

        <MetricCard
          title="Average Wait"
          value={`${avgWaitMin} min`}
          subtitle={`Avg Service: ${Math.floor(avgServiceSec / 60)}:${String(Math.floor(avgServiceSec % 60)).padStart(2, '0')}`}
          icon={Clock}
          colorScheme={avgWaitMin > 15 ? 'rose' : 'emerald'}
        />

        <MetricCard
          title="Active Counters"
          value={`${activeCountersCount} / ${totalCountersCount}`}
          subtitle="Staffed service desks"
          icon={Activity}
          colorScheme="indigo"
        />
      </div>

      {/* ==================================================================== */}
      {/* ROW 2: LIVE CAMERA MONITOR + REAL-TIME CROWD ANALYTICS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 6 Cols: Live Crowd Monitor */}
        <div className="lg:col-span-6 flex flex-col">
          <LiveCrowdMonitor
            cameraConnected={cameraConnected}
            yoloRunning={yoloActive}
            fps={telemetry?.fps ?? 0}
            peopleCount={peopleCount}
            lastDetectionTime={lastDetectionTime}
            crowdStatus={crowdStatus}
          />
        </div>

        {/* Right 6 Cols: Real-Time Crowd Analytics & Correlation */}
        <div className="lg:col-span-6 flex flex-col">
          <CrowdAnalyticsCorrelation telemetry={telemetry} />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ROW 3: REAL-TIME CROWD TREND GRAPH (Section 5) */}
      {/* ==================================================================== */}
      <RealTimeCrowdChart
        data={chartHistory}
        currentCount={peopleCount}
        peakCount={peakCrowd}
        crowdStatus={crowdStatus}
      />

      {/* ==================================================================== */}
      {/* ROW 4: QUEUE ANALYTICS + COUNTER PERFORMANCE (Section 4 & 17) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Queue Flow Analytics */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                    Queue Pacing & Rates
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Mathematical queue growth and throughput pacing
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono font-bold text-[#172033]">
                {telemetry?.queue_trend ?? 'STABLE'}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-sans text-[#64748B] font-bold">Arrival Rate:</span>
                <span className="font-bold text-[#172033]">{telemetry?.arrival_rate ?? 2.4} / min</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-sans text-[#64748B] font-bold">Service Rate:</span>
                <span className="font-bold text-[#16A34A]">{telemetry?.service_rate ?? 3.1} / min</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-sans text-[#64748B] font-bold">Queue Growth Velocity:</span>
                <span className={`font-bold ${(telemetry?.queue_growth_rate ?? 0) > 0 ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
                  {telemetry?.queue_growth_rate ?? 0.0} / min
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-sans text-[#64748B] font-bold">Max Anticipated Wait:</span>
                <span className="font-bold text-[#1769E0]">{avgWaitMin} minutes</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1769E0] font-medium mt-4">
            Service pacing benchmark target: <strong>3:30 min</strong> per transaction.
          </div>
        </div>

        {/* Right 7 Cols: Real-Time Counter Performance */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                    Counter Performance & Service Status
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Active bank tellers and live transaction durations
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-[#64748B]">
                {activeCountersCount} Active Desks
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Counter</th>
                    <th className="py-2.5 px-3">Officer</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Now Serving</th>
                    <th className="py-2.5 px-3 text-right">In Queue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {counters.map((cntr) => {
                    const activeTok = cntr.active_token;
                    const isServing = cntr.current_status === 'SERVING' || activeTok?.status === 'SERVING';
                    const isCalled = cntr.current_status === 'CALLED' || activeTok?.status === 'CALLED';

                    return (
                      <tr key={cntr.counter} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-bold text-[#1769E0]">
                          Counter {String(cntr.counter).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-medium text-[#172033]">
                          {cntr.officer}
                        </td>
                        <td className="py-2.5 px-3">
                          {isServing ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE] text-[10px] font-bold">
                              IN SERVICE
                            </span>
                          ) : isCalled ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-bold">
                              CALLED
                            </span>
                          ) : cntr.active ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] text-[10px] font-bold">
                              READY
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] text-[10px] font-bold">
                              OFFLINE
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          {activeTok?.token_id ? (
                            <span className="text-[#172033]">
                              {activeTok.token_id}{' '}
                              {activeTok.elapsed_str && (
                                <span className="text-[10px] text-[#64748B] font-normal">
                                  ({activeTok.elapsed_str})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-[#94A3B8]">--</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#172033]">
                          {cntr.waiting_count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] mt-3 pt-3 border-t border-[#F1F5F9]">
            Counters dynamically pull tokens matching their specialized service capabilities.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ROW 5: ESP32 HARDWARE STATUS + RECENT HARDWARE EVENTS (Section 7,8,9) */}
      {/* ==================================================================== */}
      <ESP32ManagerPanel
        hardwareStatus={telemetry?.hardware_status}
        hardwareFlags={telemetry?.hardware_flags}
        esp32Connected={esp32Connected}
        esp32Ip={telemetry?.esp32_ip}
      />

      {/* ==================================================================== */}
      {/* ROW 6: CROWD ALERTS + SYSTEM RECOMMENDATIONS (Section 10 & 11) */}
      {/* ==================================================================== */}
      <CrowdAlertRecommendation
        crowdStatus={crowdStatus}
        peopleDetected={peopleCount}
        tokensWaiting={waitingTokens}
        recommendation={telemetry?.recommendation}
        currentThresholds={telemetry?.thresholds}
      />

      {/* ==================================================================== */}
      {/* BOTTOM: DOWNLOADABLE REPORT (Section 12, 13, 14, 15) */}
      {/* ==================================================================== */}
      <DownloadableReportSection />
    </div>
  );
};
