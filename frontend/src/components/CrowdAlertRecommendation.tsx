import React, { useState } from 'react';
import { AlertTriangle, Sparkles, Sliders } from 'lucide-react';
import { api } from '../services/api';
import type { SystemRecommendation, CrowdStatus } from '../types/queue';

interface CrowdAlertRecommendationProps {
  crowdStatus: CrowdStatus | string;
  peopleDetected: number;
  tokensWaiting: number;
  recommendation?: SystemRecommendation;
  currentThresholds?: { normal_max: number; moderate_max: number };
  onThresholdsUpdated?: () => void;
}

export const CrowdAlertRecommendation: React.FC<CrowdAlertRecommendationProps> = ({
  crowdStatus,
  peopleDetected,
  tokensWaiting,
  recommendation,
  currentThresholds,
  onThresholdsUpdated,
}) => {
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [normalMax, setNormalMax] = useState(currentThresholds?.normal_max || 15);
  const [moderateMax, setModerateMax] = useState(currentThresholds?.moderate_max || 30);
  const [isSaving, setIsSaving] = useState(false);

  const isHigh = crowdStatus === 'HIGH' || !!recommendation?.active;

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.setThresholds(normalMax, moderateMax);
      if (onThresholdsUpdated) onThresholdsUpdated();
      setShowThresholdsModal(false);
    } catch (err) {
      console.error('Failed to update thresholds', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Prominent High Crowd Alert Banner (Visible when High Crowd is detected) */}
      {isHigh && (
        <div className="rounded-2xl bg-[#FEF2F2] border-2 border-[#F87171] p-5 shadow-md animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#DC2626] text-white shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#DC2626]">
                    CRITICAL OPERATIONAL ALERT
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#DC2626] text-white text-[10px] font-mono font-bold">
                    CROWD: {peopleDetected}
                  </span>
                </div>
                <h4 className="text-lg font-black text-[#991B1B] mt-0.5">
                  ⚠ HIGH CROWD DETECTED IN BRANCH
                </h4>
                <p className="text-xs text-[#7F1D1D] font-medium mt-1">
                  Physical crowd count ({peopleDetected} people) exceeds normal threshold.
                  Recommended Action: Open auxiliary service counter immediately to mitigate congestion.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="px-3.5 py-2 rounded-xl bg-white border border-[#FCA5A5] text-[#991B1B] font-bold text-xs font-mono shadow-2xs">
                Activate Counter 05
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Adaptive System Recommendation Card */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                Adaptive Capacity & Counter Recommendation
              </h3>
              <p className="text-xs text-[#64748B]">
                AI correlation connecting physical crowd density with digital queue demand
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowThresholdsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-bold text-[#172033] transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#1769E0]" />
            <span>Configure Thresholds</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Recommendation Info Box */}
          <div className="md:col-span-8 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#1769E0] uppercase tracking-wider">
                {recommendation?.title || 'OPTIMAL OPERATIONS'}
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">
                Thresholds: 0–{currentThresholds?.normal_max || 15} (Norm) &bull; {((currentThresholds?.normal_max || 15) + 1)}–{currentThresholds?.moderate_max || 30} (Mod) &bull; {(currentThresholds?.moderate_max || 30) + 1}+ (High)
              </span>
            </div>
            <p className="text-sm font-black text-[#172033]">
              {recommendation?.message || 'Queue operating within normal branch capacity.'}
            </p>
            <p className="text-xs text-[#64748B] font-medium">
              {recommendation?.action || 'Maintain standard counter schedule.'}
            </p>
          </div>

          {/* Action Suggested Counter Pill */}
          <div className="md:col-span-4 text-center p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">
              Suggested Staffing Action
            </span>
            <div className="text-lg font-black font-mono text-[#1769E0] mt-1">
              {recommendation?.suggested_counter
                ? `Activate Counter 0${recommendation.suggested_counter}`
                : 'All Counters Optimal'}
            </div>
            <span className="text-[11px] text-[#64748B] font-medium mt-0.5 block">
              {tokensWaiting} waiting in digital queue
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Modal */}
      {showThresholdsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-bold text-[#172033]">
                Configure Crowd Alert Thresholds
              </h3>
              <button
                onClick={() => setShowThresholdsModal(false)}
                className="text-[#64748B] hover:text-[#172033] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Normal Crowd Limit (0 to X)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={normalMax}
                  onChange={(e) => setNormalMax(parseInt(e.target.value, 10) || 15)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#172033] font-mono"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  Current: 0–{normalMax} people will be labeled 🟢 NORMAL
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                  Moderate Crowd Limit ({normalMax + 1} to Y)
                </label>
                <input
                  type="number"
                  min={normalMax + 1}
                  max="200"
                  value={moderateMax}
                  onChange={(e) => setModerateMax(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#172033] font-mono"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  Current: {normalMax + 1}–{moderateMax} people will be labeled 🟡 MODERATE, and {moderateMax + 1}+ will be 🔴 HIGH
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowThresholdsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#1769E0] hover:bg-[#1558BD] text-white text-xs font-bold uppercase tracking-wider"
                >
                  {isSaving ? 'Saving...' : 'Save Thresholds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
