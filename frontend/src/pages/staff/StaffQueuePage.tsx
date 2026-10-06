import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  Search,
  PlusCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { api } from '../../services/api';

export const StaffQueuePage: React.FC = () => {
  const { generateToken, callNext, startService, completeService, loadingAction } = useQueue();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tokensData, setTokensData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFullQueue = async () => {
    try {
      setIsLoading(true);
      const res = await api.getQueue();
      if (res.tokens) {
        setTokensData(res.tokens);
      }
    } catch (e) {
      console.error('Error fetching full queue tokens:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFullQueue();
    const interval = setInterval(fetchFullQueue, 3500);
    return () => clearInterval(interval);
  }, []);

  // Filter tokens by search term and status
  const filteredTokens = tokensData.filter((t) => {
    const matchSearch = t.token_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <ListOrdered className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider">
              Queue Roster & Customer Tickets
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Customer Queue Management
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => generateToken()}
            disabled={loadingAction === 'GENERATE'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1769E0] hover:bg-[#1558BD] text-white font-bold text-xs tracking-wider shadow-2xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Token</span>
          </button>
          <button
            onClick={fetchFullQueue}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] transition-colors cursor-pointer shadow-2xs"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by token (e.g. C001, A103)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] text-[#172033] text-xs font-mono placeholder-[#94A3B8] focus:outline-none focus:border-[#1769E0]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'WAITING', 'CALLED', 'SERVING', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1769E0] text-white shadow-2xs'
                  : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Active & Historical Token Registry
          </span>
          <span className="text-xs font-mono text-[#64748B]">
            Total Logged: <strong className="text-[#172033]">{filteredTokens.length}</strong>
          </span>
        </div>

        {filteredTokens.length === 0 ? (
          <div className="py-14 text-center text-[#64748B] text-sm font-medium">
            <Users className="w-10 h-10 mx-auto mb-2 text-[#CBD5E1]" />
            <p className="text-[#172033] font-bold">No matching customer tickets found.</p>
            <p className="text-xs text-[#64748B] mt-1">Generate a token to begin customer flow.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold bg-[#F8FAFC]">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Token ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Counter</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredTokens.map((tok, idx) => {
                  const isWaiting = tok.status === 'WAITING';
                  const isServing = tok.status === 'SERVING';
                  const isCompleted = tok.status === 'COMPLETED';
                  const isCalled = tok.status === 'CALLED';

                  return (
                    <tr key={tok.token_id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EFF6FF] text-[#1769E0] font-bold text-xs border border-[#BFDBFE]">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-sm text-[#172033] tracking-wide">
                        {tok.token_id}
                      </td>
                      <td className="py-3.5 px-3 font-sans font-medium text-[#172033]">
                        {tok.customer_name || `Customer #${tok.token_id.replace(/\D/g, '') || '01'}`}
                      </td>
                      <td className="py-3.5 px-3 font-sans text-[#64748B]">
                        {tok.service_type || 'General Banking'}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-[#1769E0]">
                        Counter {tok.assigned_counter ? `${tok.assigned_counter < 10 ? '0' : ''}${tok.assigned_counter}` : '03'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isServing
                              ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                              : isCalled
                              ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                              : isCompleted
                              ? 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                              : 'bg-[#EFF6FF] text-[#1769E0] border-[#BFDBFE]'
                          }`}
                        >
                          {tok.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[#64748B]">
                        {new Date(tok.created_at * 1000).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {isWaiting && (
                          <button
                            onClick={() => callNext(tok.assigned_counter)}
                            className="px-3 py-1 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1769E0] font-bold border border-[#BFDBFE] text-[11px] transition-colors cursor-pointer"
                          >
                            Call
                          </button>
                        )}
                        {isCalled && (
                          <button
                            onClick={() => startService(tok.assigned_counter)}
                            className="px-3 py-1 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#16A34A] font-bold border border-[#86EFAC] text-[11px] transition-colors cursor-pointer"
                          >
                            Start
                          </button>
                        )}
                        {isServing && (
                          <button
                            onClick={() => completeService(tok.assigned_counter)}
                            className="px-3 py-1 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#16A34A] font-bold border border-[#86EFAC] text-[11px] transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
