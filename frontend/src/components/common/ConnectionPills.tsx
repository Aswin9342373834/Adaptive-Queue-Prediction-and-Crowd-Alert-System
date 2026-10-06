import React from 'react';
import { Camera, Cpu, Wifi, WifiOff } from 'lucide-react';
import type { TelemetryData } from '../../types/queue';

interface ConnectionPillsProps {
  telemetry: TelemetryData | null;
  isConnected: boolean;
  isReconnecting: boolean;
  compact?: boolean;
}

export const ConnectionPills: React.FC<ConnectionPillsProps> = ({
  telemetry,
  isConnected,
  isReconnecting,
  compact = false,
}) => {
  const cameraOk = Boolean(telemetry?.camera_connected);
  const esp32Ok = Boolean(telemetry?.esp32_connected);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <span
          title="Backend Connected"
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] text-[11px]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
          <span>System</span>
        </span>

        <span
          title={cameraOk ? 'Camera Connected' : 'Camera Disconnected'}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] ${
            cameraOk
              ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
              : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cameraOk ? 'bg-[#16A34A]' : 'bg-[#94A3B8]'}`} />
          <span>Vision</span>
        </span>

        <span
          title={esp32Ok ? 'ESP32 Online' : 'ESP32 Standby'}
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] ${
            esp32Ok
              ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
              : 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${esp32Ok ? 'bg-[#16A34A]' : 'bg-[#D97706]'}`} />
          <span>ESP32</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* System Status */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
        <span className="text-[#172033] font-semibold font-sans">System Online</span>
      </div>

      {/* Camera */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
        <Camera className={`w-3.5 h-3.5 ${cameraOk ? 'text-[#16A34A]' : 'text-[#64748B]'}`} />
        <span className="text-[#475569] font-medium font-sans">
          {cameraOk ? 'Camera Connected' : 'Camera Standby'}
        </span>
      </div>

      {/* ESP32 Hardware */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
        <Cpu className={`w-3.5 h-3.5 ${esp32Ok ? 'text-[#16A34A]' : 'text-[#D97706]'}`} />
        <span className="text-[#475569] font-medium font-sans">
          {esp32Ok ? 'Hardware Connected' : 'Hardware Standby'}
        </span>
      </div>

      {/* Live Stream Bus */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all ${
          isConnected
            ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
            : isReconnecting
            ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706] animate-pulse'
            : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
        }`}
      >
        {isConnected ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Backend Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{isReconnecting ? 'Reconnecting...' : 'Stream Offline'}</span>
          </>
        )}
      </div>
    </div>
  );
};
