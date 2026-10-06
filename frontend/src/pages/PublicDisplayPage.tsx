import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Maximize2,
  Minimize2,
  Clock,
  Users,
  Volume2,
  VolumeX,
  Calendar,
  Layers,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { api } from '../services/api';
import type { PublicQueueData } from '../types/queue';

export const PublicDisplayPage: React.FC = () => {
  const { telemetry, isConnected } = useQueue();
  const [publicData, setPublicData] = useState<PublicQueueData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const prevTokenRef = useRef<string | null>(null);
  const [tokenAnim, setTokenAnim] = useState(false);
  const [restConnected, setRestConnected] = useState(true);

  // High-fidelity synthesized banking chime (Web Audio API)
  const playBankChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const now = ctx.currentTime;
      // Tone 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2: G#5 (830.61 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.0);
    } catch {
      // Audio playback restrictions fallback
    }
  };

  // 1. Live digital clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Real-time data sync with REST endpoint fallback every 1.5s
  useEffect(() => {
    let isMounted = true;

    const fetchPublicQueue = async () => {
      try {
        const data = await api.getPublicQueue();
        if (isMounted) {
          setPublicData(data);
          setRestConnected(true);
        }
      } catch {
        if (isMounted) {
          setRestConnected(false);
        }
      }
    };

    fetchPublicQueue();
    const interval = setInterval(fetchPublicQueue, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute live values from WebSocket telemetry or REST publicData
  const activeTokenId =
    (telemetry?.serving_token_id && telemetry.serving_token_id !== 'None')
      ? telemetry.serving_token_id
      : (telemetry?.current_token && telemetry.current_token !== 'None')
      ? telemetry.current_token
      : publicData?.nowServing?.token || null;

  const activeCounterNum = publicData?.nowServing?.counter || 3;
  const activeCounterStr = String(activeCounterNum).padStart(2, '0');

  // Trigger smooth animation and chime whenever the serving token changes
  useEffect(() => {
    if (activeTokenId && activeTokenId !== prevTokenRef.current) {
      if (prevTokenRef.current !== null) {
        setTokenAnim(true);
        setTimeout(() => setTokenAnim(false), 800);

        if (soundEnabled) {
          playBankChime();
        }
      }
      prevTokenRef.current = activeTokenId;
    } else if (!activeTokenId) {
      prevTokenRef.current = null;
    }
  }, [activeTokenId, soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Live Statistics Calculations
  const peopleWaiting =
    publicData?.peopleWaiting ??
    telemetry?.tokens_waiting ??
    telemetry?.waiting_area_count ??
    0;

  const estimatedWaitMin =
    publicData?.estimatedWaitMinutes ??
    (telemetry ? Math.round(telemetry.max_wait_minutes || ((telemetry.average_service_time_seconds || 180) / 60) * Math.max(1, peopleWaiting)) : 12);

  const activeCountersCount = publicData?.activeCounters ?? 4;
  const totalCountersCount = publicData?.totalCounters ?? 6;

  // Next Tokens List
  let nextTokensList: { token: string; counter: number }[] = [];
  if (publicData?.nextTokens && publicData.nextTokens.length > 0) {
    nextTokensList = publicData.nextTokens.slice(0, 8);
  } else if (telemetry?.waiting_queue && telemetry.waiting_queue.length > 0) {
    const cycleCounters = [3, 1, 5, 2, 4, 3, 1, 5];
    nextTokensList = telemetry.waiting_queue.slice(0, 8).map((item, idx) => ({
      token: item.token_id,
      counter: cycleCounters[idx % cycleCounters.length],
    }));
  }

  const isSystemOnline = isConnected || restConnected;

  // Format date: "Tuesday, October 6, 2026"
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Format time: "10:42:18 AM"
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#172033] flex flex-col justify-between font-sans selection:bg-[#1769E0] selection:text-white select-none">
      {/* ==================================================================== */}
      {/* 1. HEADER (CLEAN WHITE BANKING HEADER) */}
      {/* ==================================================================== */}
      <header className="bg-white border-b border-[#E2E8F0] shadow-sm px-4 sm:px-8 py-3.5 sm:py-4.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Bank Logo, Name & Live Queue Pill */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EBF3FE] border border-[#BFDBFE] flex items-center justify-center text-[#1769E0] shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#172033] uppercase">
                Smart Bank
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#EBF3FE] text-[#1769E0] rounded-full border border-[#BFDBFE] tracking-wide">
                LIVE QUEUE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium">
              Real-Time Customer Service & Token Status
            </p>
          </div>
        </div>

        {/* Right: Live Indicator, Clock, Date, Mute & Fullscreen */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live Indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${
              isSystemOnline
                ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                : 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isSystemOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isSystemOnline ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                }`}
              ></span>
            </span>
            <span>{isSystemOnline ? 'LIVE' : 'OFFLINE'}</span>
          </div>

          {/* Real-time Clock & Date */}
          <div className="flex flex-col items-end px-4 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-base sm:text-lg font-black font-mono text-[#172033] tracking-wide">
              {formattedTime}
            </span>
            <div className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#1769E0]" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Sound Notification Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-[#EBF3FE] border-[#BFDBFE] text-[#1769E0] hover:bg-[#DBEAFE]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8] hover:text-[#64748B]'
            }`}
            title={soundEnabled ? 'Chime Enabled' : 'Chime Muted'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 sm:p-3 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#172033] shadow-sm transition-all cursor-pointer active:scale-95"
            title="Toggle TV Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. MAIN DISPLAY CONTENT (TWO-COLUMN RESPONSIVE LAYOUT) */}
      {/* ==================================================================== */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ================================================================== */}
        {/* LEFT COLUMN: MAIN NOW SERVING CARD (LARGEST ON SCREEN) */}
        {/* ================================================================== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Top Tag & Active Status */}
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#1769E0] animate-pulse"></span>
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-[#64748B]">
                NOW SERVING
              </h2>
            </div>
            {activeTokenId ? (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                COUNTER ACTIVE
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                STANDBY
              </span>
            )}
          </div>

          {/* Central Showcase: Token & Counter */}
          <div className="my-auto py-8 sm:py-12 text-center">
            {activeTokenId ? (
              <div
                className={`transition-all duration-500 transform ${
                  tokenAnim ? 'scale-105 opacity-90' : 'scale-100 opacity-100'
                }`}
              >
                {/* TOKEN Title */}
                <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  TOKEN
                </div>

                {/* Token Number: 64-96px Bold Typography */}
                <div className="text-7xl sm:text-8xl md:text-9xl font-black font-mono text-[#1769E0] tracking-tight leading-none mb-6">
                  {activeTokenId}
                </div>

                {/* COUNTER Display */}
                <div className="inline-flex flex-col items-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    COUNTER
                  </div>
                  <div className="px-8 py-2.5 rounded-2xl bg-[#EBF3FE] border-2 border-[#1769E0] text-[#1769E0] shadow-sm">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-wide">
                      {activeCounterStr}
                    </span>
                  </div>
                </div>

                {/* Directive Message */}
                <p className="text-lg sm:text-2xl font-bold text-[#172033] mt-6 tracking-tight">
                  Please proceed to Counter {activeCounterStr}
                </p>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mb-4">
                  <Layers className="w-10 h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mb-2">
                  No customer is currently being served
                </h3>
                <p className="text-base sm:text-lg text-[#64748B] font-medium">
                  Please wait for your token to be called
                </p>
              </div>
            )}
          </div>

          {/* Footer Guide inside Now Serving card */}
          <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs sm:text-sm text-[#64748B]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#1769E0]" />
              <span>Token numbers are called in sequence by priority and arrival.</span>
            </div>
            <span className="font-mono font-bold text-[#1769E0] hidden sm:inline-block">
              {telemetry?.last_action || 'System active'}
            </span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: 3 STATS CARDS + NEXT TOKENS CARD */}
        {/* ================================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          {/* Row of 3 Live Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: PEOPLE WAITING */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  PEOPLE WAITING
                </span>
                <div className="p-2 rounded-xl bg-[#E0F2FE] text-[#0284C7]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-[#172033]">
                {peopleWaiting}
              </div>
              <span className="text-[11px] text-[#64748B] font-medium mt-1">
                Customers in queue
              </span>
            </div>

            {/* Card 2: ESTIMATED WAIT */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  ESTIMATED WAIT
                </span>
                <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#D97706]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-[#1769E0]">
                ~{estimatedWaitMin} MIN
              </div>
              <span className="text-[11px] text-[#64748B] font-medium mt-1">
                Based on current queue
              </span>
            </div>

            {/* Card 3: ACTIVE COUNTERS */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  ACTIVE COUNTERS
                </span>
                <div className="p-2 rounded-xl bg-[#DCFCE7] text-[#16A34A]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-[#16A34A]">
                {String(activeCountersCount).padStart(2, '0')} / {String(totalCountersCount).padStart(2, '0')}
              </div>
              <span className="text-[11px] text-[#64748B] font-medium mt-1">
                Counters currently serving
              </span>
            </div>
          </div>

          {/* Large Card: NEXT TOKENS */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex-1 flex flex-col justify-between min-h-[340px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#172033] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1769E0]"></span>
                NEXT TOKENS
              </h3>
              {nextTokensList.length > 0 && (
                <span className="text-xs font-mono font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                  {nextTokensList.length} in line
                </span>
              )}
            </div>

            {/* Next Tokens Grid/List (5-8 tokens) */}
            {nextTokensList.length === 0 ? (
              <div className="py-12 my-auto text-center flex flex-col items-center justify-center">
                <p className="text-base sm:text-lg font-semibold text-[#64748B]">
                  No customers waiting
                </p>
                <span className="text-xs text-[#94A3B8] mt-1">
                  New tokens will appear here automatically
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
                {nextTokensList.map((item, idx) => (
                  <div
                    key={`${item.token}-${idx}`}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between hover:bg-[#F1F5F9] transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">
                        Position #{idx + 1}
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-[#172033] tracking-wide">
                        {item.token}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#64748B] block font-medium">Assigned</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-[#1769E0] bg-[#EBF3FE] px-2.5 py-0.5 rounded-lg border border-[#BFDBFE] inline-block">
                        Counter {String(item.counter).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Note */}
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-center text-xs text-[#64748B] font-medium">
              Please watch this screen for your token number to be called.
            </div>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* 3. BOTTOM INFORMATION BAR */}
      {/* ==================================================================== */}
      <footer className="bg-white border-t border-[#E2E8F0] shadow-sm px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-[#475569] font-medium text-center sm:text-left">
          <Info className="w-4 h-4 text-[#1769E0] shrink-0" />
          <span>Please keep your token ready and proceed to the counter when your number is called.</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSystemOnline ? (
            <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span>Queue System Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#DC2626] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
              <span>Connection Lost</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
