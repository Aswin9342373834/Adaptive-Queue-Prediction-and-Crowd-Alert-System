import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  Flame,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';

export const ManagerHardwarePage: React.FC = () => {
  const { telemetry, testHardware, loadingAction } = useQueue();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const isConnected = Boolean(telemetry?.esp32_connected);
  const esp32Ip = telemetry?.esp32_ip ?? '192.168.1.100';
  const hwFlags = telemetry?.hardware_flags;

  const handleTestDispatch = async (level: string) => {
    try {
      setTestStatus(null);
      const res = await testHardware(level);
      setTestStatus(`Dispatched "${level}" signal to ESP32: ${res.result?.status || 'OK'}`);
      setTimeout(() => setTestStatus(null), 4000);
    } catch (err: any) {
      setTestStatus(`Test Error: ${err.message || 'Failed'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <Cpu className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider">
              Physical Alert Integration
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            ESP32 Microcontroller & Hardware Alert Bus
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Physical LED indicator light tower and acoustic alert buzzer management
          </p>
        </div>

        {/* Connection Status Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
            isConnected
              ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A] shadow-2xs'
              : 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A]"></span>
              </span>
              <span>ESP32 HARDWARE CONNECTED</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D97706]"></span>
              <span>SIMULATION MODE (STANDBY)</span>
            </>
          )}
        </div>
      </div>

      {/* Hero Physical Tower Card */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#172033] uppercase tracking-wider">
              Real-Time Hardware Indicator State
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              Reflects live physical state dispatched by queue prediction engine
            </p>
          </div>

          <span className="text-xs font-mono font-bold bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-[#64748B]">
            Current Level: <strong className="text-[#172033]">{hwFlags?.level ?? 'NORMAL'}</strong>
          </span>
        </div>

        {/* 5 Indicator Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* GREEN LED */}
          <div
            className={`p-5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[160px] ${
              hwFlags?.led_green
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A] shadow-2xs'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                NORMAL LEVEL
              </span>
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            </div>

            <div className="my-2">
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center transition-all ${
                  hwFlags?.led_green
                    ? 'bg-[#16A34A] shadow-[0_0_16px_rgba(22,163,74,0.6)] text-white'
                    : 'bg-[#CBD5E1] text-[#64748B]'
                }`}
              >
                <span className="text-xs font-mono font-bold">
                  {hwFlags?.led_green ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold font-sans text-[#172033]">GREEN LED</span>
          </div>

          {/* YELLOW LED */}
          <div
            className={`p-5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[160px] ${
              hwFlags?.led_yellow
                ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706] shadow-2xs'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                MODERATE
              </span>
              <AlertCircle className="w-4 h-4 text-[#D97706]" />
            </div>

            <div className="my-2">
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center transition-all ${
                  hwFlags?.led_yellow
                    ? 'bg-[#D97706] shadow-[0_0_16px_rgba(217,119,6,0.6)] text-white'
                    : 'bg-[#CBD5E1] text-[#64748B]'
                }`}
              >
                <span className="text-xs font-mono font-bold">
                  {hwFlags?.led_yellow ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold font-sans text-[#172033]">YELLOW LED</span>
          </div>

          {/* ORANGE LED */}
          <div
            className={`p-5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[160px] ${
              hwFlags?.led_orange
                ? 'bg-[#FFEDD5] border-[#FDBA74] text-[#EA580C] shadow-2xs'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                HIGH LOAD
              </span>
              <AlertTriangle className="w-4 h-4 text-[#EA580C]" />
            </div>

            <div className="my-2">
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center transition-all ${
                  hwFlags?.led_orange
                    ? 'bg-[#EA580C] shadow-[0_0_16px_rgba(234,88,12,0.6)] text-white'
                    : 'bg-[#CBD5E1] text-[#64748B]'
                }`}
              >
                <span className="text-xs font-mono font-bold">
                  {hwFlags?.led_orange ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold font-sans text-[#172033]">ORANGE LED</span>
          </div>

          {/* RED LED */}
          <div
            className={`p-5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[160px] ${
              hwFlags?.led_red
                ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626] shadow-2xs'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                CRITICAL
              </span>
              <Flame className="w-4 h-4 text-[#DC2626]" />
            </div>

            <div className="my-2">
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center transition-all ${
                  hwFlags?.led_red
                    ? 'bg-[#DC2626] shadow-[0_0_16px_rgba(220,38,38,0.6)] animate-pulse text-white'
                    : 'bg-[#CBD5E1] text-[#64748B]'
                }`}
              >
                <span className="text-xs font-mono font-bold">
                  {hwFlags?.led_red ? 'ALERT' : 'OFF'}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold font-sans text-[#172033]">RED LED</span>
          </div>

          {/* BUZZER */}
          <div
            className={`p-5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[160px] ${
              hwFlags?.buzzer
                ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626] shadow-2xs'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                ACOUSTIC
              </span>
              {hwFlags?.buzzer ? <Volume2 className="w-4 h-4 text-[#DC2626]" /> : <VolumeX className="w-4 h-4 text-[#94A3B8]" />}
            </div>

            <div className="my-2">
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center transition-all ${
                  hwFlags?.buzzer
                    ? 'bg-[#DC2626] shadow-[0_0_16px_rgba(220,38,38,0.6)] animate-bounce text-white'
                    : 'bg-[#CBD5E1] text-[#64748B]'
                }`}
              >
                <span className="text-xs font-mono font-bold">
                  {hwFlags?.buzzer ? 'BEEP' : 'OFF'}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold font-sans text-[#172033]">BUZZER</span>
          </div>
        </div>
      </div>

      {/* Manual Hardware Test Dispatcher */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-5">
          <div>
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
              Manual Hardware Signal Dispatch (Live Demo Test)
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              Trigger instant HTTP POST REST payload to the ESP32 to test physical light tower states
            </p>
          </div>

          {testStatus && (
            <span className="text-xs px-3 py-1 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE] font-bold">
              {testStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleTestDispatch('NORMAL')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] font-bold text-xs tracking-wider transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>TEST NORMAL</span>
          </button>

          <button
            onClick={() => handleTestDispatch('MODERATE')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] font-bold text-xs tracking-wider transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <AlertCircle className="w-4 h-4" />
            <span>TEST MODERATE</span>
          </button>

          <button
            onClick={() => handleTestDispatch('HIGH')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#FFEDD5] border border-[#FDBA74] text-[#EA580C] font-bold text-xs tracking-wider transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>TEST HIGH</span>
          </button>

          <button
            onClick={() => handleTestDispatch('CRITICAL')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FCDAD7] border border-[#FCA5A5] text-[#DC2626] font-bold text-xs tracking-wider transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>TEST CRITICAL</span>
          </button>
        </div>
      </div>

      {/* Expandable Technical Pin Details */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#1769E0]" />
            <span>Technical GPIO & Firmware Specifications</span>
          </span>
          <span className="text-[#1769E0] font-mono">
            {showTechnicalDetails ? '[-] Collapse Details' : '[+] Expand Details'}
          </span>
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 pt-4 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1 font-sans font-semibold">Target Endpoint:</span>
              <strong className="text-[#172033]">http://{esp32Ip}:80/hardware/status</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1 font-sans font-semibold">GREEN LED Pin:</span>
              <strong className="text-[#16A34A]">GPIO 25</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1 font-sans font-semibold">YELLOW LED Pin:</span>
              <strong className="text-[#D97706]">GPIO 26</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1 font-sans font-semibold">ORANGE LED Pin:</span>
              <strong className="text-[#EA580C]">GPIO 27</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1 font-sans font-semibold">RED LED Pin:</span>
              <strong className="text-[#DC2626]">GPIO 14</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] block mb-1 font-sans font-semibold">BUZZER Pin:</span>
              <strong className="text-[#DC2626]">GPIO 13</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
