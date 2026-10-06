import React from 'react';
import { Camera, Sparkles, WifiOff } from 'lucide-react';
import { api } from '../services/api';

interface LiveCrowdMonitorProps {
  cameraConnected: boolean;
  yoloRunning: boolean;
  fps: number;
  peopleCount: number;
  lastDetectionTime: string;
  crowdStatus: string;
}

export const LiveCrowdMonitor: React.FC<LiveCrowdMonitorProps> = ({
  cameraConnected,
  yoloRunning,
  fps,
  peopleCount,
  lastDetectionTime,
  crowdStatus,
}) => {
  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                Live Crowd Monitor
              </h3>
              <p className="text-xs text-[#64748B]">
                Computer vision & YOLO spatial detection stream
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {cameraConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DCFCE7] border border-[#86EFAC] text-[11px] font-bold font-mono text-[#16A34A]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
                <span>● CAMERA CONNECTED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-[11px] font-bold font-mono text-[#DC2626]">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span>🔴 CAMERA OFFLINE</span>
              </span>
            )}

            {yoloRunning ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] font-bold font-mono text-[#1769E0]">
                <Sparkles className="w-3 h-3 text-[#1769E0]" />
                <span>● YOLO ACTIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[11px] font-bold font-mono text-[#D97706]">
                <span>● YOLO STANDBY</span>
              </span>
            )}

            {cameraConnected && fps > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-bold font-mono text-[#64748B]">
                {fps} FPS
              </span>
            )}
          </div>
        </div>

        {/* Video Screen Container */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#0F172A] border border-[#E2E8F0] flex items-center justify-center shadow-inner">
          {cameraConnected ? (
            <img
              src={api.getVideoFeedUrl()}
              alt="Live Camera Feed with YOLO Annotations"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-8 text-white space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mx-auto flex items-center justify-center text-[#F87171]">
                <WifiOff className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider">
                  CAMERA OFFLINE
                </h4>
                <p className="text-xs text-[#94A3B8] mt-1 max-w-sm mx-auto">
                  Waiting for camera device connection on local port. Connect USB camera or start video stream.
                </p>
              </div>
              <div className="inline-block px-3 py-1 rounded-lg bg-white/10 text-[11px] font-mono text-[#CBD5E1]">
                Last Detection: {lastDetectionTime}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detection Stats Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#F1F5F9]">
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-[10px] font-bold text-[#64748B] uppercase block">
            People Detected
          </span>
          <div className="text-2xl font-black font-mono text-[#172033] mt-0.5">
            {cameraConnected ? peopleCount : 0}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-[10px] font-bold text-[#64748B] uppercase block">
            Crowd Density Status
          </span>
          <div className="text-base font-black font-mono mt-1">
            {crowdStatus === 'HIGH' ? (
              <span className="text-[#DC2626]">🔴 HIGH</span>
            ) : crowdStatus === 'MODERATE' ? (
              <span className="text-[#D97706]">🟡 MODERATE</span>
            ) : (
              <span className="text-[#16A34A]">🟢 NORMAL</span>
            )}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-[10px] font-bold text-[#64748B] uppercase block">
            Last Detection
          </span>
          <div className="text-xs font-bold font-mono text-[#1769E0] mt-1.5 truncate">
            {lastDetectionTime}
          </div>
        </div>
      </div>
    </div>
  );
};
