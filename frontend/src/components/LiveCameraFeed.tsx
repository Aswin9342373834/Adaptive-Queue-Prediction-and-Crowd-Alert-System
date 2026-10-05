import React, { useState } from 'react';
import { Camera, Maximize2, RefreshCw, Eye } from 'lucide-react';
import { api } from '../services/api';

interface LiveCameraFeedProps {
  fps?: number;
  cameraConnected?: boolean;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({ fps = 30, cameraConnected = true }) => {
  const [streamKey, setStreamKey] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const reloadStream = () => {
    setStreamKey(Date.now());
  };

  return (
    <div className={`rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg flex flex-col ${isFullscreen ? 'fixed inset-4 z-50 bg-navy-950 p-6' : ''}`}>
      <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Live AI Vision & Tracking Feed
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-800 border border-navy-700 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE (1280x720 @ {fps} FPS)</span>
          </div>
          <button
            onClick={reloadStream}
            title="Reload Video Feed"
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-navy-950 border border-navy-800 flex items-center justify-center">
        {cameraConnected ? (
          <img
            key={streamKey}
            src={api.getVideoFeedUrl()}
            alt="Real-Time OpenCV Video Stream"
            className="w-full h-full object-contain"
            onError={() => {
              console.warn('[VIDEO] Error loading MJPEG stream, retrying in 2s...');
              setTimeout(reloadStream, 2000);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Camera className="w-12 h-12 mb-2 stroke-1 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">Webcam Stream Disconnected</p>
            <p className="text-xs text-slate-600 mt-1">Check physical camera connection or permissions</p>
          </div>
        )}

        {/* Live Overlay Tag */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 text-[11px] font-mono text-slate-200 flex items-center gap-2 pointer-events-none">
          <Eye className="w-3.5 h-3.5 text-brand-cyan" />
          <span>YOLOv8 + ByteTrack ROI Overlay</span>
        </div>
      </div>
    </div>
  );
};
