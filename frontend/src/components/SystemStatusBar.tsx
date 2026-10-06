import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface SystemStatusBarProps {
  backendConnected: boolean;
  cameraConnected: boolean;
  yoloActive: boolean;
  esp32Connected: boolean;
  websocketConnected: boolean;
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({
  backendConnected,
  cameraConnected,
  yoloActive,
  esp32Connected,
  websocketConnected,
}) => {
  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1769E0]" />
          <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
            System Live Connectivity Matrix
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold">
          {/* 1. Backend */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
              backendConnected
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
                : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
              }`}
            />
            <span>{backendConnected ? 'BACKEND CONNECTED' : 'BACKEND OFFLINE'}</span>
          </span>

          {/* 2. Camera */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
              cameraConnected
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
                : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cameraConnected ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
              }`}
            />
            <span>{cameraConnected ? 'CAMERA CONNECTED' : 'CAMERA OFFLINE'}</span>
          </span>

          {/* 3. YOLO */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
              yoloActive
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1769E0]'
                : 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                yoloActive ? 'bg-[#1769E0]' : 'bg-[#D97706]'
              }`}
            />
            <span>{yoloActive ? 'YOLO ACTIVE' : 'YOLO INACTIVE'}</span>
          </span>

          {/* 4. ESP32 */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
              esp32Connected
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
                : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                esp32Connected ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
              }`}
            />
            <span>{esp32Connected ? 'ESP32 CONNECTED' : 'ESP32 OFFLINE'}</span>
          </span>

          {/* 5. WebSocket */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
              websocketConnected
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
                : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                websocketConnected ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
              }`}
            />
            <span>{websocketConnected ? 'WEBSOCKET CONNECTED' : 'WEBSOCKET OFFLINE'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
