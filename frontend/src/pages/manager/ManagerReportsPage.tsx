import React from 'react';
import { FileText } from 'lucide-react';
import { DownloadableReportSection } from '../../components/DownloadableReportSection';

export const ManagerReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 pb-2">
        <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Branch Operations & Compliance Reports
          </h2>
          <p className="text-xs text-[#64748B]">
            Download verified audit records, queue milestones, crowd logs, and counter pacing summaries
          </p>
        </div>
      </div>

      <DownloadableReportSection />
    </div>
  );
};
