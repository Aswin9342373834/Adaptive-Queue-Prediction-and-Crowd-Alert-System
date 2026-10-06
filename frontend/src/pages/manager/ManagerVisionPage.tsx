import React, { useState } from 'react';
import {
  Camera,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { api } from '../../services/api';

export const ManagerVisionPage: React.FC = () => {
  const { telemetry } = useQueue();
  const [streamKey, setStreamKey] = useState(() => Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const reloadStream = () => {
    setStreamKey(Date.now());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <Camera className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider">
              Live Crowd Vision
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Branch Optical Crowd & Spatial Tracking
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Real-time computer vision camera feed and waiting area occupancy telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadStream}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#1769E0]" />
            <span>Refresh Feed</span>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1769E0] border border-[#BFDBFE] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Expand Feed'}</span>
          </button>
        </div>
      </div>

      {/* Main Camera Showcase */}
      <div
        className={`rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm flex flex-col ${
          isFullscreen ? 'fixed inset-4 z-50 bg-white p-6 overflow-auto shadow-2xl' : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase tracking-wider">
            <Eye className="w-4 h-4 text-[#1769E0]" />
            <span>Overhead Waiting Area Camera Stream</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
              <span>{telemetry?.fps ? `${telemetry.fps} FPS` : '30 FPS'} &bull; 1280x720</span>
            </span>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
          {telemetry?.camera_connected ? (
            <img
              key={streamKey}
              src={api.getVideoFeedUrl()}
              alt="Live Video Stream"
              className="w-full h-full object-contain"
              onError={() => {
                setTimeout(reloadStream, 2500);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 text-[#94A3B8]">
              <Camera className="w-12 h-12 mb-3 text-[#CBD5E1]" />
              <p className="text-base font-bold text-[#172033]">Live Camera Stream Standby</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm">
                Optical camera stream will render here once physical webcam or video source is connected.
              </p>
            </div>
          )}

          {/* Clean Overlay Banner */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2E8F0] text-xs font-mono font-bold text-[#172033] flex items-center gap-2 pointer-events-none shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#1769E0] animate-pulse" />
            <span>AI Spatial Zone Tracking Active</span>
          </div>
        </div>

        {/* Vision Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
              People in Camera Frame
            </span>
            <span className="text-3xl font-black font-mono text-[#172033]">
              {telemetry?.people_detected ?? 0}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
              Inside Waiting Area ROI
            </span>
            <span className="text-3xl font-black font-mono text-[#16A34A]">
              {telemetry?.waiting_area_count ?? 0}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
              Active Track IDs
            </span>
            <span className="text-3xl font-black font-mono text-[#1769E0]">
              {telemetry?.active_tracks ?? 0}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
              Movement State
            </span>
            <span className="text-3xl font-black font-mono text-[#1769E0]">
              Normal
            </span>
          </div>
        </div>
      </div>

      {/* Technical Engineering Accordion */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-[#64748B] uppercase tracking-wider hover:text-[#172033] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#1769E0]" />
            <span>Technical Computer Vision Specifications</span>
          </span>
          <span className="text-[#1769E0] font-mono">{showTechDetails ? '[-] Hide Details' : '[+] View Details'}</span>
        </button>

        {showTechDetails && (
          <div className="mt-4 pt-4 border-t border-[#F1F5F9] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] font-sans block mb-1 font-semibold">Detection Model:</span>
              <strong className="text-[#172033]">YOLOv8 Nano (yolov8n.pt)</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] font-sans block mb-1 font-semibold">Tracker Algorithm:</span>
              <strong className="text-[#172033]">ByteTrack (bytetrack.yaml)</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[#64748B] font-sans block mb-1 font-semibold">Stream Engine:</span>
              <strong className="text-[#172033]">MJPEG Multipart Boundary (Port 8000)</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
