import React from 'react';
import { Users, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { TelemetryData } from '../types/queue';

interface CrowdAnalyticsCorrelationProps {
  telemetry: TelemetryData | null;
}

export const CrowdAnalyticsCorrelation: React.FC<CrowdAnalyticsCorrelationProps> = ({
  telemetry,
}) => {
  const peopleDetected = telemetry?.people_detected ?? 0;
  const waitingTokens = telemetry?.tokens_waiting ?? 0;
  const waitingAreaPeople = telemetry?.waiting_area_count ?? 0;
  const inServiceCount = telemetry?.in_service_count ?? (telemetry?.serving_token_id && telemetry.serving_token_id !== 'None' ? 1 : 0);
  const otherAreaEstimated = telemetry?.other_area_estimated ?? Math.max(0, peopleDetected - waitingAreaPeople - inServiceCount);

  const peakCrowd = telemetry?.peak_crowd ?? peopleDetected;
  const avgCrowd = telemetry?.avg_crowd ?? peopleDetected;
  const peopleEntering = telemetry?.people_entering ?? 0;
  const peopleLeaving = telemetry?.people_leaving ?? 0;
  const completedTokens = telemetry?.tokens_completed ?? 8;

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                Real-Time Crowd & Queue Analytics
              </h3>
              <p className="text-xs text-[#64748B]">
                Spatial computer vision correlation with digital banking tickets
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#1769E0]">
            AI Grounded
          </span>
        </div>

        {/* 1. Real-Time Crowd Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">
              Current Crowd
            </span>
            <div className="text-xl font-black font-mono text-[#172033] mt-0.5">
              {peopleDetected}
            </div>
            <span className="text-[10px] text-[#94A3B8]">camera count</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">
              Peak Crowd
            </span>
            <div className="text-xl font-black font-mono text-[#D97706] mt-0.5">
              {peakCrowd}
            </div>
            <span className="text-[10px] text-[#94A3B8]">today's max</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">
              Average Crowd
            </span>
            <div className="text-xl font-black font-mono text-[#1769E0] mt-0.5">
              {avgCrowd}
            </div>
            <span className="text-[10px] text-[#94A3B8]">pacing mean</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">
              Completed
            </span>
            <div className="text-xl font-black font-mono text-[#16A34A] mt-0.5">
              {completedTokens}
            </div>
            <span className="text-[10px] text-[#94A3B8]">services served</span>
          </div>
        </div>

        {/* 2. Queue + Camera Correlation Box (Section 6) */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#1769E0]" />
              Queue & Camera Spatial Correlation
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">Real-Time Sync</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] text-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">
                Camera Detected
              </span>
              <span className="text-lg font-black text-[#172033] mt-0.5 block">
                {peopleDetected} <span className="text-[10px] font-normal text-[#64748B]">people</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] text-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">
                Waiting Queue
              </span>
              <span className="text-lg font-black text-[#1769E0] mt-0.5 block">
                {waitingTokens} <span className="text-[10px] font-normal text-[#64748B]">tokens</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] text-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">
                In Service
              </span>
              <span className="text-lg font-black text-[#16A34A] mt-0.5 block">
                {inServiceCount} <span className="text-[10px] font-normal text-[#64748B]">active</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] text-center relative">
              <span className="text-[10px] font-bold text-[#64748B] uppercase block font-sans">
                Other / Hall
              </span>
              <span className="text-lg font-black text-[#64748B] mt-0.5 block">
                {otherAreaEstimated} <span className="text-[10px] font-normal text-[#64748B]">est.</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] italic leading-tight">
            * Note: Non-queue individuals in the branch lobby are categorized as <strong>Estimated</strong> without making assumptions on customer status.
          </p>
        </div>
      </div>

      {/* Traffic Flows Footer */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#F1F5F9] text-xs">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="p-1 rounded-lg bg-[#DCFCE7] text-[#16A34A]">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-bold uppercase">People Entering</span>
            <span className="font-mono font-bold text-[#172033]">{peopleEntering} total</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="p-1 rounded-lg bg-[#EFF6FF] text-[#1769E0]">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-bold uppercase">People Leaving</span>
            <span className="font-mono font-bold text-[#172033]">{peopleLeaving} total</span>
          </div>
        </div>
      </div>
    </div>
  );
};
