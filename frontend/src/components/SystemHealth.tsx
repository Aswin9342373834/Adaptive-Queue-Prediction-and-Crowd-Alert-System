import React from 'react';
import { CheckCircle2, XCircle, Activity, Server, Video, Cpu } from 'lucide-react';
import type { TelemetryData } from '../types/queue';

interface SystemHealthProps {
  telemetry: TelemetryData | null;
  isConnected: boolean;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ telemetry, isConnected }) => {
  const modules = [
    {
      name: 'Physical Camera Stream',
      status: telemetry?.camera_connected ? 'CONNECTED (1280x720)' : 'DISCONNECTED',
      ok: Boolean(telemetry?.camera_connected),
      icon: Video,
    },
    {
      name: 'YOLOv8 Person Detection',
      status: telemetry?.yolo_running ? 'RUNNING (Conf >= 0.45)' : 'INITIALIZING',
      ok: Boolean(telemetry?.yolo_running),
      icon: Cpu,
    },
    {
      name: 'ByteTrack Spatial Tracker',
      status: telemetry?.tracking_running ? `${telemetry?.active_tracks ?? 0} Active Session Tracks` : 'INITIALIZING',
      ok: Boolean(telemetry?.tracking_running),
      icon: Activity,
    },
    {
      name: 'Digital Queue Engine',
      status: telemetry ? `Prefix 'C' | ${telemetry.tokens_waiting} Waiting` : 'READY',
      ok: true,
      icon: Server,
    },
    {
      name: 'Predictive Analytics Engine',
      status: telemetry ? `Window: 60s | Trend: ${telemetry.queue_trend}` : 'READY',
      ok: true,
      icon: Activity,
    },
    {
      name: 'ESP32 Physical Alert Hardware',
      status: telemetry?.esp32_connected ? `ONLINE (${telemetry.esp32_ip ?? '192.168.1.150'})` : 'STANDBY / OFFLINE',
      ok: Boolean(telemetry?.esp32_connected),
      icon: Cpu,
    },
    {
      name: 'WebSocket Live Bus',
      status: isConnected ? 'STREAMING (10 Hz)' : 'RECONNECTING',
      ok: isConnected,
      icon: Activity,
    },
  ];

  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg">
      <div className="border-b border-navy-800 pb-3 mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          System & Engine Health Diagnostics
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time execution status of integrated computer vision and queue pipeline modules
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
        {modules.map((m, idx) => {
          const IconComponent = m.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-navy-850 border border-navy-800"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-md ${m.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-sans font-semibold text-slate-200 block text-xs">
                    {m.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {m.status}
                  </span>
                </div>
              </div>
              {m.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
