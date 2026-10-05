import React, { useState } from 'react';
import { Cpu, Wifi, WifiOff, Volume2, VolumeX, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import type { TelemetryData } from '../types/queue';
import { api } from '../services/api';

interface ESP32HardwareCardProps {
  telemetry: TelemetryData | null;
}

export const ESP32HardwareCard: React.FC<ESP32HardwareCardProps> = ({ telemetry }) => {
  const [testingLevel, setTestingLevel] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<string | null>(null);

  const isConnected = Boolean(telemetry?.esp32_connected);
  const esp32Ip = telemetry?.esp32_ip ?? '192.168.1.150';
  const hwFlags = telemetry?.hardware_flags;

  const handleTest = async (level: string) => {
    try {
      setTestingLevel(level);
      setTestResponse(null);
      const res = await api.testHardwareLevel(level);
      setTestResponse(`Test "${level}" dispatched: ${res.result?.status ?? 'OK'}`);
    } catch (err: any) {
      setTestResponse(`Error: ${err.message}`);
    } finally {
      setTestingLevel(null);
    }
  };

  return (
    <div className="rounded-2xl bg-navy-900/90 border border-navy-700/80 p-5 shadow-xl backdrop-blur-sm space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ESP32 Physical Alert Hardware
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-navy-800 text-slate-300 border border-navy-700">
                Phase 8
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Target IP: <span className="text-brand-cyan font-bold">{esp32Ip}:80</span> &bull; Wi-Fi REST POST
            </p>
          </div>
        </div>

        {/* Connection Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>HARDWARE ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              <span>OFFLINE / SIMULATION MODE</span>
            </>
          )}
        </div>
      </div>

      {/* Real-Time GPIO State Matrix */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Live GPIO Pin Matrix
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Active Congestion State: <strong className="text-white">{hwFlags?.level ?? 'NORMAL'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
          {/* GREEN LED */}
          <div className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
            hwFlags?.led_green
              ? 'bg-emerald-500/20 border-emerald-500/60 shadow-lg shadow-emerald-500/20 text-emerald-300'
              : 'bg-navy-850 border-navy-800 text-slate-600 opacity-60'
          }`}>
            <span className={`w-3.5 h-3.5 rounded-full mb-1.5 transition-all ${
              hwFlags?.led_green ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse' : 'bg-slate-700'
            }`} />
            <span className="text-xs font-bold font-sans">GREEN LED</span>
            <span className="text-[10px] text-slate-400 mt-0.5">GPIO 25 (220Ω)</span>
            <span className="text-[10px] font-bold mt-1">
              {hwFlags?.led_green ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          {/* YELLOW LED */}
          <div className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
            hwFlags?.led_yellow
              ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/20 text-amber-300'
              : 'bg-navy-850 border-navy-800 text-slate-600 opacity-60'
          }`}>
            <span className={`w-3.5 h-3.5 rounded-full mb-1.5 transition-all ${
              hwFlags?.led_yellow ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse' : 'bg-slate-700'
            }`} />
            <span className="text-xs font-bold font-sans">YELLOW LED</span>
            <span className="text-[10px] text-slate-400 mt-0.5">GPIO 26 (220Ω)</span>
            <span className="text-[10px] font-bold mt-1">
              {hwFlags?.led_yellow ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          {/* ORANGE LED */}
          <div className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
            hwFlags?.led_orange
              ? 'bg-orange-500/20 border-orange-500/60 shadow-lg shadow-orange-500/20 text-orange-300'
              : 'bg-navy-850 border-navy-800 text-slate-600 opacity-60'
          }`}>
            <span className={`w-3.5 h-3.5 rounded-full mb-1.5 transition-all ${
              hwFlags?.led_orange ? 'bg-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.9)] animate-pulse' : 'bg-slate-700'
            }`} />
            <span className="text-xs font-bold font-sans">ORANGE LED</span>
            <span className="text-[10px] text-slate-400 mt-0.5">GPIO 27 (220Ω)</span>
            <span className="text-[10px] font-bold mt-1">
              {hwFlags?.led_orange ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          {/* RED LED */}
          <div className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
            hwFlags?.led_red
              ? 'bg-rose-500/20 border-rose-500/60 shadow-lg shadow-rose-500/20 text-rose-300'
              : 'bg-navy-850 border-navy-800 text-slate-600 opacity-60'
          }`}>
            <span className={`w-3.5 h-3.5 rounded-full mb-1.5 transition-all ${
              hwFlags?.led_red ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse' : 'bg-slate-700'
            }`} />
            <span className="text-xs font-bold font-sans">RED LED</span>
            <span className="text-[10px] text-slate-400 mt-0.5">GPIO 14 (220Ω)</span>
            <span className="text-[10px] font-bold mt-1">
              {hwFlags?.led_red ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          {/* BUZZER */}
          <div className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1 ${
            hwFlags?.buzzer
              ? 'bg-red-950/80 border-rose-500 text-rose-300 shadow-lg shadow-rose-900/50'
              : 'bg-navy-850 border-navy-800 text-slate-600 opacity-60'
          }`}>
            {hwFlags?.buzzer ? (
              <Volume2 className="w-4 h-4 mb-1 text-rose-400 animate-bounce" />
            ) : (
              <VolumeX className="w-4 h-4 mb-1 text-slate-600" />
            )}
            <span className="text-xs font-bold font-sans">BUZZER</span>
            <span className="text-[10px] text-slate-400 mt-0.5">GPIO 13</span>
            <span className="text-[10px] font-bold mt-1">
              {hwFlags?.buzzer ? 'CYCLING' : 'MUTED'}
            </span>
          </div>
        </div>
      </div>

      {/* Manual Hardware Test Controls */}
      <div className="pt-2 border-t border-navy-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Hardware Diagnostic & Test Mode
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Sends direct command payload to ESP32 without altering queue state
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleTest('NORMAL')}
            disabled={testingLevel !== null}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Test Normal</span>
          </button>

          <button
            onClick={() => handleTest('MODERATE')}
            disabled={testingLevel !== null}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Test Moderate</span>
          </button>

          <button
            onClick={() => handleTest('HIGH')}
            disabled={testingLevel !== null}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Test High</span>
          </button>

          <button
            onClick={() => handleTest('CRITICAL')}
            disabled={testingLevel !== null}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Test Critical</span>
          </button>
        </div>

        {testResponse && (
          <div className="mt-3 p-2.5 rounded-lg bg-navy-850 border border-navy-700 text-xs font-mono text-brand-cyan flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>{testResponse}</span>
          </div>
        )}
      </div>
    </div>
  );
};
