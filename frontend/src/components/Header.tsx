import React from 'react';
import { ShieldCheck, Camera, Cpu, Activity, Wifi, WifiOff } from 'lucide-react';
import type { TelemetryData } from '../types/queue';

interface HeaderProps {
  telemetry: TelemetryData | null;
  isConnected: boolean;
  isReconnecting: boolean;
}

export const Header: React.FC<HeaderProps> = ({ telemetry, isConnected, isReconnecting }) => {
  return (
    <header className="bg-navy-900/80 backdrop-blur-md border-b border-navy-700/60 sticky top-0 z-50 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-blue/10 border border-brand-blue/30 rounded-xl text-brand-cyan shadow-lg shadow-brand-blue/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">
                Smart Bank Queue
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-brand-blue/20 text-brand-cyan rounded-md border border-brand-blue/30">
                PS 37 LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-Time Queue Intelligence & Crowd Management System
            </p>
          </div>
        </div>

        {/* Status Indicators Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* System Online */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">SYSTEM ONLINE</span>
          </div>

          {/* Camera Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700">
            <Camera className={`w-3.5 h-3.5 ${telemetry?.camera_connected ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-slate-300">
              {telemetry?.camera_connected ? 'CAMERA CONNECTED' : 'CAMERA OFFLINE'}
            </span>
          </div>

          {/* YOLO & Tracking */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700">
            <Cpu className={`w-3.5 h-3.5 ${telemetry?.yolo_running ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-300">YOLO + BYTETRACK</span>
          </div>

          {/* FPS */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700">
            <Activity className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="text-slate-300 font-mono">
              {telemetry ? `${telemetry.fps} FPS` : '-- FPS'}
            </span>
          </div>

          {/* WebSocket Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : isReconnecting
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>LIVE STREAM</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>{isReconnecting ? 'RECONNECTING...' : 'DISCONNECTED'}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
