import { useState } from 'react';
import { LayoutDashboard, Users, Activity, Bell, Camera, Cpu } from 'lucide-react';
import { useQueueWebSocket } from './hooks/useQueueWebSocket';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { CongestionBanner } from './components/CongestionBanner';
import { CurrentServicePanel } from './components/CurrentServicePanel';
import { TokenControls } from './components/TokenControls';
import { LiveQueueTable } from './components/LiveQueueTable';
import { LiveCameraFeed } from './components/LiveCameraFeed';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AlertsPanel } from './components/AlertsPanel';
import { SystemHealth } from './components/SystemHealth';
import { ESP32HardwareCard } from './components/ESP32HardwareCard';

type TabType = 'overview' | 'queue' | 'analytics' | 'camera' | 'hardware' | 'alerts';

export function App() {
  const { telemetry, history, isConnected, isReconnecting } = useQueueWebSocket();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const navTabs = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'camera', label: 'Live Vision & ROI', icon: Camera },
    { id: 'queue', label: 'Live Queue Table', icon: Users, badge: telemetry?.tokens_waiting },
    { id: 'analytics', label: 'Predictive Analytics', icon: Activity },
    { id: 'hardware', label: 'ESP32 Hardware', icon: Cpu },
    { id: 'alerts', label: 'Alert History', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-brand-blue selection:text-white">
      {/* 1. Header with System Status Indicators */}
      <Header
        telemetry={telemetry}
        isConnected={isConnected}
        isReconnecting={isReconnecting}
      />

      {/* 2. Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {navTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25 border border-brand-blue/50'
                      : 'bg-navy-900 text-slate-400 hover:text-slate-200 hover:bg-navy-855 border border-navy-800'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-brand-blue' : 'bg-navy-800 text-brand-cyan'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Real-Time Last Action Tag */}
          {telemetry?.last_action && (
            <div className="text-xs text-slate-400 font-mono hidden md:flex items-center gap-2 bg-navy-900 px-3 py-1.5 rounded-lg border border-navy-800">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
              <span>Event: {telemetry.last_action}</span>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Congestion Level Banner */}
            <CongestionBanner telemetry={telemetry} />

            {/* KPI Metric Cards */}
            <KpiCards telemetry={telemetry} />

            {/* Token Action Controls */}
            <TokenControls lastAction={telemetry?.last_action} />

            {/* Active Service Panel */}
            <CurrentServicePanel telemetry={telemetry} />

            {/* Two-Column: Live Camera Stream & Live Queue Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <LiveCameraFeed
                  fps={telemetry?.fps}
                  cameraConnected={telemetry?.camera_connected}
                />
              </div>
              <div className="lg:col-span-5">
                <LiveQueueTable queue={telemetry?.waiting_queue ?? []} />
              </div>
            </div>

            {/* Physical Hardware Card */}
            <ESP32HardwareCard telemetry={telemetry} />

            {/* Real-Time Recharts Analytics */}
            <AnalyticsCharts history={history} />

            {/* Two-Column: Alerts Log & System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <AlertsPanel
                  currentAlertMessage={telemetry?.alert_message}
                  currentLevel={telemetry?.congestion_level}
                />
              </div>
              <div className="lg:col-span-6">
                <SystemHealth
                  telemetry={telemetry}
                  isConnected={isConnected}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: LIVE VISION & ROI */}
        {/* ================================================================== */}
        {activeTab === 'camera' && (
          <div className="space-y-6">
            <LiveCameraFeed
              fps={telemetry?.fps}
              cameraConnected={telemetry?.camera_connected}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">People Detected</span>
                <span className="text-2xl font-bold font-mono text-white">{telemetry?.people_detected ?? 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Inside Waiting Area ROI</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">{telemetry?.waiting_area_count ?? 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-900 border border-navy-800">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Active Spatial Tracks</span>
                <span className="text-2xl font-bold font-mono text-brand-cyan">{telemetry?.active_tracks ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: LIVE QUEUE TABLE */}
        {/* ================================================================== */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            <TokenControls lastAction={telemetry?.last_action} />
            <CurrentServicePanel telemetry={telemetry} />
            <LiveQueueTable queue={telemetry?.waiting_queue ?? []} />
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: PREDICTIVE ANALYTICS */}
        {/* ================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <KpiCards telemetry={telemetry} />
            <AnalyticsCharts history={history} />
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: ESP32 PHYSICAL HARDWARE */}
        {/* ================================================================== */}
        {activeTab === 'hardware' && (
          <div className="space-y-6">
            <ESP32HardwareCard telemetry={telemetry} />
            <SystemHealth
              telemetry={telemetry}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 6: ALERTS & DIAGNOSTICS */}
        {/* ================================================================== */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <CongestionBanner telemetry={telemetry} />
            <ESP32HardwareCard telemetry={telemetry} />
            <AlertsPanel
              currentAlertMessage={telemetry?.alert_message}
              currentLevel={telemetry?.congestion_level}
            />
            <SystemHealth
              telemetry={telemetry}
              isConnected={isConnected}
            />
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-navy-800/80 bg-navy-900/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        PS 37 — Adaptive Queue Prediction and Crowd Alert System &bull; Live Real-Time OpenCV + YOLOv8 + ByteTrack + FastAPI Engine
      </footer>
    </div>
  );
}

export default App;
