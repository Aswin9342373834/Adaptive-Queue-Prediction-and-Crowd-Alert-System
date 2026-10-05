import React, { useState } from 'react';
import { PlusCircle, Megaphone, Play, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface TokenControlsProps {
  lastAction?: string;
}

export const TokenControls: React.FC<TokenControlsProps> = ({ lastAction }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAction = async (actionType: string, fn: () => Promise<any>, successMsg: string) => {
    try {
      setLoadingAction(actionType);
      const res = await fn();
      if (res.token_id) {
        setFeedback(`${successMsg}: ${res.token_id}`);
      } else if (res.status === 'no_waiting_tokens') {
        setFeedback('No waiting tokens in line');
      } else if (res.status === 'no_token_to_serve') {
        setFeedback('No token available to serve');
      } else if (res.status === 'no_active_service') {
        setFeedback('No active service to complete');
      } else {
        setFeedback(successMsg);
      }
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
      setFeedback(`Error: ${err.message || 'Action failed'}`);
      setTimeout(() => setFeedback(null), 3500);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="rounded-xl bg-navy-900 border border-navy-700/80 p-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Token & Service Operations
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Trigger live state transitions in the Python backend queue engine
          </p>
        </div>
        {feedback && (
          <span className="text-xs px-3 py-1 rounded-md bg-brand-blue/20 text-brand-cyan border border-brand-blue/30 font-medium animate-pulse">
            {feedback}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Generate Token */}
        <button
          onClick={() => handleAction('GENERATE', api.generateToken, 'Token Generated')}
          disabled={loadingAction !== null}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-blue hover:bg-blue-600 active:scale-98 transition-all font-semibold text-xs tracking-wider text-white shadow-lg shadow-brand-blue/20 disabled:opacity-50"
        >
          {loadingAction === 'GENERATE' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PlusCircle className="w-4 h-4" />
          )}
          <span>GENERATE TOKEN [N]</span>
        </button>

        {/* 2. Call Next */}
        <button
          onClick={() => handleAction('CALL_NEXT', api.callNext, 'Called Token')}
          disabled={loadingAction !== null}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 border border-amber-500/40 text-amber-300 active:scale-98 transition-all font-semibold text-xs tracking-wider shadow-md disabled:opacity-50"
        >
          {loadingAction === 'CALL_NEXT' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Megaphone className="w-4 h-4 text-amber-400" />
          )}
          <span>CALL NEXT [C]</span>
        </button>

        {/* 3. Start Service */}
        <button
          onClick={() => handleAction('START_SVC', api.startService, 'Started Service')}
          disabled={loadingAction !== null}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 border border-brand-cyan/40 text-brand-cyan active:scale-98 transition-all font-semibold text-xs tracking-wider shadow-md disabled:opacity-50"
        >
          {loadingAction === 'START_SVC' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 text-brand-cyan" />
          )}
          <span>START SERVICE [S]</span>
        </button>

        {/* 4. Complete Service */}
        <button
          onClick={() => handleAction('COMPLETE_SVC', api.completeService, 'Completed Service')}
          disabled={loadingAction !== null}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all font-semibold text-xs tracking-wider text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {loadingAction === 'COMPLETE_SVC' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>COMPLETE SERVICE [D]</span>
        </button>
      </div>

      {lastAction && (
        <div className="mt-3 pt-3 border-t border-navy-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Last System Action: <strong className="text-slate-200">{lastAction}</strong></span>
          <span className="text-slate-500 font-mono">Keys [N / C / S / D] also supported</span>
        </div>
      )}
    </div>
  );
};
