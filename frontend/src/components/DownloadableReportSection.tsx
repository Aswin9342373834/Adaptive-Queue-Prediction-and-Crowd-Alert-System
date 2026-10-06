import React, { useState, useEffect } from 'react';
import { Download, FileText, Printer, RefreshCw, Cpu, Camera, Users, Clock } from 'lucide-react';
import { api } from '../services/api';
import type { ReportSummaryResponse } from '../types/queue';

export const DownloadableReportSection: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | '7days'>('today');
  const [report, setReport] = useState<ReportSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (p: 'today' | 'yesterday' | '7days') => {
    try {
      setLoading(true);
      const data = await api.getReportSummary(p);
      setReport(data);
    } catch (err) {
      console.error('Failed to load report summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const handleDownloadCsv = () => {
    const url = api.getExportReportUrl(period, 'csv');
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart_bank_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#172033] tracking-tight">
              Executive Audit & Compliance Performance Report
            </h3>
            <p className="text-xs text-[#64748B]">
              Real-time audit log export grounded in physical computer vision, queues, and hardware data
            </p>
          </div>
        </div>

        {/* Period Buttons and Download Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
            {(['today', 'yesterday', '7days'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === p
                    ? 'bg-[#1769E0] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                {p === 'today' ? 'Today' : p === 'yesterday' ? 'Yesterday' : 'Last 7 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchReport(period)}
            disabled={loading}
            className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] transition-colors cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD CSV REPORT</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#172033] text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Structured Report Preview */}
      {report && (
        <div className="space-y-6">
          {/* Top Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono">
            <div>
              <span className="text-[#64748B]">Branch:</span>{' '}
              <strong className="text-[#172033]">{report.branch}</strong>
            </div>
            <div>
              <span className="text-[#64748B]">Report Date:</span>{' '}
              <strong className="text-[#172033]">{report.report_date}</strong> &bull; Period:{' '}
              <strong className="text-[#1769E0] uppercase">{report.report_period}</strong>
            </div>
            <div>
              <span className="text-[#64748B]">Generated:</span>{' '}
              <strong className="text-[#172033]">{report.generated_at}</strong>
            </div>
          </div>

          {/* Section 1 & 2: Queue and Crowd Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Queue Summary */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
                <Clock className="w-4 h-4 text-[#1769E0]" />
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Queue Summary
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans">Total Tokens</span>
                  <span className="text-lg font-black text-[#172033]">{report.queue_summary.total_tokens}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans">Completed</span>
                  <span className="text-lg font-black text-[#16A34A]">{report.queue_summary.completed_tokens}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans">Avg Wait Time</span>
                  <span className="text-lg font-black text-[#1769E0]">{report.queue_summary.average_waiting_time_minutes} min</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans">Avg Service Duration</span>
                  <span className="text-lg font-black text-[#172033]">{report.queue_summary.average_service_time_str}</span>
                </div>
              </div>
            </div>

            {/* Crowd Summary */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
                <Users className="w-4 h-4 text-[#1769E0]" />
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Crowd Summary
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans">Peak Crowd</span>
                  <span className="text-lg font-black text-[#D97706]">{report.crowd_summary.peak_crowd}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans">Average Crowd</span>
                  <span className="text-lg font-black text-[#1769E0]">{report.crowd_summary.avg_crowd}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans">High Crowd Events</span>
                  <span className="text-lg font-black text-[#DC2626]">{report.crowd_summary.high_crowd_events}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-sans">Moderate Events</span>
                  <span className="text-lg font-black text-[#D97706]">{report.crowd_summary.moderate_crowd_events}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Counter Performance Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Counter Performance Breakdown
            </h4>
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Counter</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3 text-center">Customers Served</th>
                    <th className="py-2.5 px-3 text-right">Avg Service Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {report.counter_performance.map((cp) => (
                    <tr key={cp.counter} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-3 font-bold text-[#1769E0]">
                        Counter {String(cp.counter).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-[#172033]">{cp.name}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#172033]">{cp.customers_served}</td>
                      <td className="py-2.5 px-3 text-right text-[#64748B]">{cp.avg_service_str}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Camera & Hardware Telemetry Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs font-mono">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase font-sans mb-1">
                <Camera className="w-3.5 h-3.5 text-[#1769E0]" />
                Camera Stream Status
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Status:</span>
                <span className="font-bold text-[#16A34A]">{report.camera_summary.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Snapshots Recorded:</span>
                <span>{report.camera_summary.total_snapshots}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Detection Span:</span>
                <span>{report.camera_summary.detection_start} – {report.camera_summary.detection_end}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs font-mono">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase font-sans mb-1">
                <Cpu className="w-3.5 h-3.5 text-[#1769E0]" />
                ESP32 Hardware Status
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Hardware Link:</span>
                <span className="font-bold text-[#16A34A]">{report.hardware_summary.esp32_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Sensor Events:</span>
                <span>{report.hardware_summary.total_sensor_events}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Last Heartbeat:</span>
                <span>{report.hardware_summary.last_heartbeat}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
