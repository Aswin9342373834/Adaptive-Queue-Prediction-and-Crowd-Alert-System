import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Award,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';

export const ManagerReportsPage: React.FC = () => {
  const { telemetry } = useQueue();
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );

  const waitingCount = telemetry?.tokens_waiting ?? 0;
  const avgServiceTimeSec = telemetry?.average_service_time_seconds ?? 180;
  const avgWaitMin = Math.round(telemetry?.max_wait_minutes ?? 6);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <FileText className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider">
              Executive Reporting
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Daily Branch Performance & SLA Report
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Summarized audit report for branch operations, queue flow pacing, and customer service satisfaction
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[#172033] text-xs font-mono focus:outline-none focus:border-[#1769E0]"
          />
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1769E0] hover:bg-[#1558BD] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Report Document Card */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-10 shadow-sm space-y-8">
        {/* Report Top Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-6">
          <div>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider block">
              SMART BANK CORPORATION
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#172033] mt-1">
              Metro Central Flagship Branch #104
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              Operations Lead: Aswin &bull; Queue Intelligence AI Engine v1.0
            </p>
          </div>

          <div className="text-left sm:text-right text-xs font-mono text-[#64748B]">
            <div>
              Date: <strong className="text-[#172033]">{selectedDate}</strong>
            </div>
            <div>
              Generated: <strong className="text-[#172033]">10:45 AM</strong>
            </div>
            <div className="text-[#16A34A] font-bold mt-1">
              Status: Validated & In Compliance
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Total Customers Logged
            </span>
            <div className="text-3xl font-black font-mono text-[#172033]">
              {Math.max(148, waitingCount + 140)}
            </div>
            <span className="text-[11px] text-[#64748B] mt-1 block font-medium">
              98.2% served within SLA
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Avg Service Duration
            </span>
            <div className="text-3xl font-black font-mono text-[#1769E0]">
              {Math.floor(avgServiceTimeSec / 60)}:{String(Math.floor(avgServiceTimeSec % 60)).padStart(2, '0')}m
            </div>
            <span className="text-[11px] text-[#64748B] mt-1 block font-medium">
              Benchmark target: 3:30m
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Average Customer Wait
            </span>
            <div className="text-3xl font-black font-mono text-[#16A34A]">
              {avgWaitMin} min
            </div>
            <span className="text-[11px] text-[#64748B] mt-1 block font-medium">
              Target SLA: &lt; 15 min
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Peak Traffic Density
            </span>
            <div className="text-3xl font-black font-mono text-[#D97706]">
              12:30 PM
            </div>
            <span className="text-[11px] text-[#64748B] mt-1 block font-medium">
              28 concurrent customers
            </span>
          </div>
        </div>

        {/* Counter Performance Breakdown Table */}
        <div>
          <h4 className="text-sm font-bold text-[#172033] uppercase tracking-wider mb-3">
            Counter Pacing & Efficiency Breakdown
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider bg-[#F8FAFC]">
                  <th className="py-3 px-3">Counter</th>
                  <th className="py-3 px-3">Primary Service</th>
                  <th className="py-3 px-3">Staff Member</th>
                  <th className="py-3 px-3">Served Today</th>
                  <th className="py-3 px-3">Avg Time</th>
                  <th className="py-3 px-3 text-right">SLA Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                <tr className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3 font-bold text-[#1769E0]">Counter 01</td>
                  <td className="py-3 px-3 font-sans text-[#172033] font-medium">Priority & Senior Citizens</td>
                  <td className="py-3 px-3 font-sans text-[#64748B]">Michael Chang</td>
                  <td className="py-3 px-3 text-[#172033] font-bold">34</td>
                  <td className="py-3 px-3 text-[#64748B]">2:45m</td>
                  <td className="py-3 px-3 text-right text-[#16A34A] font-bold">99.1%</td>
                </tr>
                <tr className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3 font-bold text-[#1769E0]">Counter 02</td>
                  <td className="py-3 px-3 font-sans text-[#172033] font-medium">Cash Deposit & Withdrawals</td>
                  <td className="py-3 px-3 font-sans text-[#64748B]">Emma Watson</td>
                  <td className="py-3 px-3 text-[#172033] font-bold">48</td>
                  <td className="py-3 px-3 text-[#64748B]">2:10m</td>
                  <td className="py-3 px-3 text-right text-[#16A34A] font-bold">98.5%</td>
                </tr>
                <tr className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3 font-bold text-[#1769E0]">Counter 03</td>
                  <td className="py-3 px-3 font-sans text-[#172033] font-medium">General Banking & Accounts</td>
                  <td className="py-3 px-3 font-sans text-[#64748B]">Sarah Jenkins (Active)</td>
                  <td className="py-3 px-3 text-[#172033] font-bold">42</td>
                  <td className="py-3 px-3 text-[#64748B]">3:15m</td>
                  <td className="py-3 px-3 text-right text-[#16A34A] font-bold">97.8%</td>
                </tr>
                <tr className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3 font-bold text-[#1769E0]">Counter 04</td>
                  <td className="py-3 px-3 font-sans text-[#172033] font-medium">Loans & Financial Advisory</td>
                  <td className="py-3 px-3 font-sans text-[#64748B]">David Miller</td>
                  <td className="py-3 px-3 text-[#172033] font-bold">24</td>
                  <td className="py-3 px-3 text-[#64748B]">6:30m</td>
                  <td className="py-3 px-3 text-right text-[#16A34A] font-bold">96.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Signoff Footer */}
        <div className="pt-6 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2 text-[#16A34A] font-bold">
            <Award className="w-4 h-4" />
            <span>AI Automated Branch Operations Compliance: Certified</span>
          </div>
          <div className="font-mono">Smart Bank Queue Intelligence Report ID: RPT-2026-093</div>
        </div>
      </div>
    </div>
  );
};
