import React, { useState } from 'react';
import { Cpu, Activity } from 'lucide-react';
import { api } from '../services/api';
import type { HardwareStatus, HardwareFlags } from '../types/queue';

interface ESP32ManagerPanelProps {
  hardwareStatus?: HardwareStatus;
  hardwareFlags?: HardwareFlags;
  esp32Connected: boolean;
  esp32Ip?: string;
}

export const ESP32ManagerPanel: React.FC<ESP32ManagerPanelProps> = ({
  hardwareStatus,
  hardwareFlags,
  esp32Connected,
  esp32Ip = '192.168.1.100',
}) => {
  const [testingLevel, setTestingLevel] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<string | null>(null);

  const handleTest = async (level: string) => {
    try {
      setTestingLevel(level);
      const res = await api.testHardwareLevel(level);
      setTestResponse(`Test dispatched: ${level} (${res.result?.status || 'OK'})`);
      setTimeout(() => setTestResponse(null), 4000);
    } catch (e: any) {
      setTestResponse(`Failed: ${e.message}`);
      setTimeout(() => setTestResponse(null), 4000);
    } finally {
      setTestingLevel(null);
    }
  };

  const isConnected = esp32Connected || !!hardwareStatus?.is_connected;
  const heartbeatAgo = hardwareStatus?.last_heartbeat_ago || (isConnected ? '1 second ago' : 'Offline');
  const recentEvents = hardwareStatus?.recent_events || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 6 Cols: Hardware Status & LEDs */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  ESP32 Hardware Status
                </h3>
                <p className="text-xs text-[#64748B]">
                  Physical alert controller & OLED display gateway
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-bold font-mono ${
                isConnected
                  ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
                  : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#16A34A] animate-ping' : 'bg-[#DC2626]'}`} />
              <span>{isConnected ? '● ONLINE' : '🔴 ESP32 OFFLINE'}</span>
            </span>
          </div>

          {/* Device Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">
                Wi-Fi Link
              </span>
              <span className={`font-bold mt-1 block ${isConnected ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">
                IP Address
              </span>
              <span className="font-bold text-[#172033] mt-1 block truncate">
                {esp32Ip}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">
                Last Heartbeat
              </span>
              <span className="font-bold text-[#1769E0] mt-1 block truncate">
                {heartbeatAgo}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">
                Sensor Link
              </span>
              <span className={`font-bold mt-1 block ${isConnected ? 'text-[#16A34A]' : 'text-[#64748B]'}`}>
                {isConnected ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Live LED Status Visualizer */}
          <div className="space-y-2 mb-4">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
              Physical Alert Output State
            </span>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
              <div
                className={`p-2.5 rounded-xl border ${
                  hardwareFlags?.led_green
                    ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A] font-bold shadow-2xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full mx-auto mb-1.5 block ${
                    hardwareFlags?.led_green ? 'bg-[#16A34A]' : 'bg-[#CBD5E1]'
                  }`}
                />
                <span>GREEN (Normal)</span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  hardwareFlags?.led_yellow
                    ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706] font-bold shadow-2xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full mx-auto mb-1.5 block ${
                    hardwareFlags?.led_yellow ? 'bg-[#D97706]' : 'bg-[#CBD5E1]'
                  }`}
                />
                <span>YELLOW (Mod)</span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  hardwareFlags?.led_orange
                    ? 'bg-[#FFEDD5] border-[#FDBA74] text-[#EA580C] font-bold shadow-2xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full mx-auto mb-1.5 block ${
                    hardwareFlags?.led_orange ? 'bg-[#EA580C]' : 'bg-[#CBD5E1]'
                  }`}
                />
                <span>ORANGE (High)</span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  hardwareFlags?.led_red
                    ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626] font-bold shadow-2xs animate-pulse'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full mx-auto mb-1.5 block ${
                    hardwareFlags?.led_red ? 'bg-[#DC2626]' : 'bg-[#CBD5E1]'
                  }`}
                />
                <span>RED (Critical)</span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  hardwareFlags?.buzzer
                    ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626] font-bold shadow-2xs animate-pulse'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full mx-auto mb-1.5 block ${
                    hardwareFlags?.buzzer ? 'bg-[#DC2626]' : 'bg-[#CBD5E1]'
                  }`}
                />
                <span>BUZZER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Verification Controls */}
        <div className="pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase">
              Hardware Diagnostic Trigger:
            </span>
            {testResponse && (
              <span className="text-[11px] font-mono font-bold text-[#1769E0] animate-pulse">
                {testResponse}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['NORMAL', 'MODERATE', 'HIGH', 'CRITICAL'] as const).map((lvl) => (
              <button
                key={lvl}
                disabled={testingLevel === lvl}
                onClick={() => handleTest(lvl)}
                className="py-1.5 px-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[10px] font-bold font-mono text-[#172033] transition-colors cursor-pointer disabled:opacity-50"
              >
                {testingLevel === lvl ? 'Sending...' : `Test ${lvl}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right 6 Cols: Recent Hardware Events */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  Recent Hardware Events
                </h3>
                <p className="text-xs text-[#64748B]">
                  Real-time audit log of sensor triggers and heartbeat pings
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-[#64748B]">
              Latest {recentEvents.length} Events
            </span>
          </div>

          {/* Event Feed List */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8]">
                <Cpu className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" />
                <p className="text-xs">No hardware events logged yet.</p>
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#1769E0] shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-[#172033] block truncate font-mono">
                        {evt.event_type}
                      </span>
                      <span className="text-[11px] text-[#64748B] block truncate">
                        {evt.details || 'System status update'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span className="text-[10px] text-[#64748B] block">{evt.time_str}</span>
                    <span className="text-[10px] font-bold text-[#16A34A]">{evt.level}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="text-[11px] text-[#64748B] mt-4 pt-3 border-t border-[#F1F5F9]">
          FastAPI acts as the direct hardware communication gateway over local Wi-Fi.
        </p>
      </div>
    </div>
  );
};
