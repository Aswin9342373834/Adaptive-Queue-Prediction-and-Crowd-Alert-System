import React from 'react';
import { ListOrdered, User, Hourglass } from 'lucide-react';
import type { WaitingCustomer } from '../types/queue';

interface LiveQueueTableProps {
  queue: WaitingCustomer[];
}

export const LiveQueueTable: React.FC<LiveQueueTableProps> = ({ queue }) => {
  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-brand-blue" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Waiting Queue
          </h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy-800 text-slate-300 border border-navy-700 font-mono">
          {queue.length} in line
        </span>
      </div>

      <div className="overflow-x-auto flex-1">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <User className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">Queue is currently clear</p>
            <p className="text-xs text-slate-600 mt-1">Press "Generate Token" to add customers to the queue</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Position</th>
                <th className="pb-3">Token</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Est. Wait Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60 font-mono text-xs">
              {queue.map((customer) => (
                <tr key={customer.token_id} className="hover:bg-navy-850/60 transition-colors">
                  <td className="py-3 pl-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-navy-800 text-brand-cyan font-bold text-xs border border-navy-700">
                      {customer.position}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-white tracking-wide">
                    {customer.token_id}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-brand-blue/15 text-brand-cyan text-[11px] font-semibold border border-brand-blue/30">
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2 font-bold text-emerald-400 flex items-center justify-end gap-1.5 pt-4">
                    <Hourglass className="w-3.5 h-3.5 text-emerald-500/70" />
                    <span>{customer.estimated_wait}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
