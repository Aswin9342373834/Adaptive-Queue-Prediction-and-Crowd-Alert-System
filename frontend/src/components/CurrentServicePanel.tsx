import React from 'react';
import { UserCheck, Clock, ArrowRight } from 'lucide-react';
import type { TelemetryData } from '../types/queue';

interface CurrentServicePanelProps {
  telemetry: TelemetryData | null;
}

export const CurrentServicePanel: React.FC<CurrentServicePanelProps> = ({ telemetry }) => {
  const servingToken = telemetry?.serving_token_id !== 'None' ? telemetry?.serving_token_id : null;
  const currentToken = telemetry?.current_token !== 'None' ? telemetry?.current_token : null;
  const nextToken = telemetry?.next_token !== 'None' ? telemetry?.next_token : '--';
  const isServing = Boolean(servingToken);
  const elapsedStr = telemetry?.serving_elapsed_str ?? '0:00';
  const remainingStr = telemetry?.serving_remaining_str ?? '0:00';

  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-brand-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Active Counter Service
          </h3>
        </div>
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
          isServing
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : currentToken
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-navy-800 text-slate-400 border-navy-700'
        }`}>
          {isServing ? 'SERVING' : currentToken ? 'CALLED' : 'IDLE'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
        {/* Current Token Badge */}
        <div className="bg-navy-850 p-4 rounded-xl border border-navy-700/60 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            CURRENT TOKEN
          </span>
          <div className="text-3xl font-extrabold text-brand-cyan font-mono tracking-tight">
            {servingToken || currentToken || '--'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isServing ? 'In Counter Service' : currentToken ? 'Customer Called' : 'No active token'}
          </span>
        </div>

        {/* Elapsed Service Time */}
        <div className="bg-navy-850 p-4 rounded-xl border border-navy-700/60 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            SERVICE TIME
          </span>
          <div className="text-2xl font-bold text-white font-mono">
            {isServing ? elapsedStr : '--:--'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isServing ? 'Elapsed duration' : 'Counter awaiting client'}
          </span>
        </div>

        {/* Estimated Remaining Time */}
        <div className="bg-navy-850 p-4 rounded-xl border border-navy-700/60 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            EST. REMAINING
          </span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {isServing ? remainingStr : '--:--'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isServing ? 'Expected completion' : 'Standby'}
          </span>
        </div>

        {/* Next Upcoming Token */}
        <div className="bg-navy-850 p-4 rounded-xl border border-navy-700/60 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <ArrowRight className="w-3 h-3 text-brand-blue" />
            NEXT TOKEN
          </span>
          <div className="text-2xl font-bold text-brand-blue font-mono">
            {nextToken}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Position 1 in waiting line
          </span>
        </div>
      </div>
    </div>
  );
};
