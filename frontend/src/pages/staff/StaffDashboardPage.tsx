import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  PlusCircle,
  Megaphone,
  Play,
  CheckCircle,
  Clock,
  ArrowRight,
  ListOrdered,
  Users,
  Loader2,
  SkipForward,
  X,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { WaitingCustomer } from '../../types/queue';

export const StaffDashboardPage: React.FC = () => {
  const {
    telemetry,
    generateToken,
    callNext,
    startService,
    completeService,
    loadingAction,
  } = useQueue();
  const { user } = useAuth();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState('Account Service');
  const [generatedConfirmation, setGeneratedConfirmation] = useState<string | null>(null);

  // Extract counter number from assigned string (e.g., "Counter 03" -> 3)
  const counterNum = useMemo(() => {
    const match = user?.counterNumber?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
  }, [user?.counterNumber]);

  const servingToken =
    telemetry?.serving_token_id !== 'None' ? telemetry?.serving_token_id : null;
  const currentToken =
    servingToken || (telemetry?.current_token !== 'None' ? telemetry?.current_token : null);
  const isServing = Boolean(servingToken);
  const elapsedStr = telemetry?.serving_elapsed_str ?? '0:00';
  const remainingStr = telemetry?.serving_remaining_str ?? '0:00';
  
  // Filter queue specifically for this counter (or unassigned/all if none specific)
  const waitingQueue = useMemo(() => {
    const allWaiting = telemetry?.waiting_queue ?? [];
    const counterSpecific = allWaiting.filter(
      (item) => item.assigned_counter === undefined || item.assigned_counter === counterNum
    );
    return counterSpecific.length > 0 ? counterSpecific : allWaiting;
  }, [telemetry?.waiting_queue, counterNum]);

  // Identify the FIRST customer in the real waiting queue for this counter
  const nextCustomer = waitingQueue.length > 0 ? waitingQueue[0] : null;

  // Keyboard shortcut listener for rapid counter operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement).tagName
        )
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      if (key === 'N') {
        e.preventDefault();
        setShowGenerateModal(true);
      } else if (key === 'C') {
        e.preventDefault();
        if (nextCustomer) {
          callNext(counterNum);
        }
      } else if (key === 'S') {
        e.preventDefault();
        if (currentToken && !isServing) {
          startService(counterNum);
        }
      } else if (key === 'D') {
        e.preventDefault();
        if (isServing) {
          completeService(counterNum);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCustomer, currentToken, isServing, counterNum, callNext, startService, completeService]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await generateToken({
        customer_name: customerName.trim(),
        mobile_number: customerPhone.trim(),
        service_type: serviceType,
        assigned_counter: counterNum,
      });
      const tok = res?.token_id || 'New Token';
      setGeneratedConfirmation(tok);
      setCustomerName('');
      setCustomerPhone('');
    } catch {
      // Handled in QueueContext feedback
    }
  };

  const handleSkip = async () => {
    await callNext(counterNum);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider">
              Assigned Service Desk &bull; {user?.counterNumber || 'Counter 03'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Staff Counter Dashboard
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Call registered customers, manage counter consultations, and record service milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge level={telemetry?.congestion_level} size="md" />
          <span className="text-xs font-mono font-bold text-[#64748B] bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
            {waitingQueue.length} Assigned Waiting
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. TOP ACTION ROW: PROMINENT NEXT CUSTOMER CARD & DESK STATUS CARD */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* PROMINENT NEXT CUSTOMER CARD (8 Columns) */}
        <div className="lg:col-span-8 rounded-2xl bg-white border-2 border-[#1769E0] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1769E0]" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1769E0] animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1769E0]">
                  NEXT CUSTOMER FOR {user?.counterNumber?.toUpperCase() || 'COUNTER 03'}
                </h3>
              </div>

              {nextCustomer ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
                  Position #1 in Counter Queue
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                  No Assigned Queue
                </span>
              )}
            </div>

            {/* Customer Details Content */}
            {nextCustomer ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-2">
                <div>
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">
                    Ready to Call
                  </span>
                  <div className="text-5xl sm:text-6xl font-black font-mono text-[#1769E0] tracking-tight">
                    {nextCustomer.token_id}
                  </div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl text-xs space-y-1 sm:min-w-[240px]">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span>Customer:</span>
                    <strong className="text-[#172033] font-semibold truncate max-w-[140px]">
                      {nextCustomer.customer_name || `Customer #${nextCustomer.token_id.replace(/\D/g, '') || '01'}`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span>Service:</span>
                    <strong className="text-[#172033] truncate max-w-[140px]">
                      {nextCustomer.service_type || 'Account Service'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span>Waiting:</span>
                    <strong className="text-[#16A34A]">{nextCustomer.estimated_wait || '2 min'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mx-auto mb-2">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-[#172033]">NO CUSTOMERS WAITING FOR THIS COUNTER</h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Reception desk will assign arriving customers to this counter.
                </p>
              </div>
            )}
          </div>

          {/* Primary Call Action Button */}
          <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
            <button
              onClick={() => callNext(counterNum)}
              disabled={loadingAction !== null || !nextCustomer}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-[#1769E0] hover:bg-[#1558BD] text-white font-black text-sm uppercase tracking-wider shadow-sm active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {loadingAction === 'CALL_NEXT' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Megaphone className="w-5 h-5" />
              )}
              <span>
                {nextCustomer ? `CALL NEXT [C] (${nextCustomer.token_id})` : 'NO CUSTOMERS WAITING'}
              </span>
            </button>
          </div>
        </div>

        {/* DESK CAPACITY / MANUAL TICKET CARD (4 Columns) */}
        <div className="lg:col-span-4 rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1769E0]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Counter Desk
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#16A34A] font-bold bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                Online
              </span>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Customers are registered by the Reception Desk and routed to this counter based on service needs.
            </p>

            <div className="space-y-2 mb-4">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Assigned Desk:</span>
                <strong className="text-[#172033] font-mono">{user?.counterNumber || 'Counter 03'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Assigned Queue:</span>
                <strong className="text-[#1769E0] font-mono font-bold">{waitingQueue.length} Customers</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:text-[#172033] font-bold text-xs uppercase tracking-wider shadow-2xs active:scale-98 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#1769E0]" />
            <span>Manual Walk-in Ticket</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. CURRENT SERVICE AT THIS COUNTER SECTION */}
      {/* ==================================================================== */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isServing
                  ? 'bg-[#16A34A] animate-pulse'
                  : currentToken
                  ? 'bg-[#D97706] animate-pulse'
                  : 'bg-[#CBD5E1]'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              CURRENT TOKEN AT {user?.counterNumber?.toUpperCase() || 'COUNTER 03'}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${
              isServing
                ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                : currentToken
                ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
            }`}
          >
            {isServing ? 'NOW SERVING' : currentToken ? 'CALLED — AWAITING ARRIVAL' : 'COUNTER IDLE'}
          </span>
        </div>

        {/* Current Serving Details & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-2">
          {/* Token Display (7 Cols) */}
          <div className="md:col-span-7 text-center md:text-left">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest block mb-1">
              Active Customer
            </span>
            <div className="text-5xl sm:text-6xl font-black font-mono text-[#172033] tracking-tight">
              {currentToken || 'Counter Idle'}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#64748B] mt-2">
              {isServing
                ? 'Service session is actively running.'
                : currentToken
                ? 'Customer called. Click "Start Service" when customer arrives at counter.'
                : 'Click "Call Next" when ready to serve the next customer in line.'}
            </p>
          </div>

          {/* Service Duration Timer (5 Cols) */}
          <div className="md:col-span-5 bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
              <Clock className="w-4 h-4 text-[#1769E0]" />
              <span>Service Duration</span>
            </div>
            <div className="text-4xl sm:text-5xl font-black font-mono text-[#172033] tracking-wider">
              {isServing ? elapsedStr : '0:00'}
            </div>
            <span className="text-[11px] text-[#64748B] mt-1 block font-medium">
              {isServing ? `Estimated Remaining: ~${remainingStr}` : 'Timer activates upon service start'}
            </span>
          </div>
        </div>

        {/* Counter Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-[#F1F5F9]">
          <button
            onClick={() => startService(counterNum)}
            disabled={loadingAction !== null || !currentToken || isServing}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#1769E0] font-bold text-xs uppercase tracking-wider shadow-2xs active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {loadingAction === 'START_SERVICE' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>START SERVICE [S]</span>
          </button>

          <button
            onClick={() => completeService(counterNum)}
            disabled={loadingAction !== null || !isServing}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs uppercase tracking-wider shadow-2xs active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {loadingAction === 'COMPLETE_SERVICE' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>COMPLETE SERVICE [D]</span>
          </button>

          <button
            onClick={handleSkip}
            disabled={loadingAction !== null || !currentToken}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FDE68A] text-[#D97706] font-bold text-xs uppercase tracking-wider shadow-2xs active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            <span>SKIP TOKEN</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. WAITING CUSTOMERS IN QUEUE TABLE (WITH FIRST ROW HIGHLIGHTED) */}
      {/* ==================================================================== */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-[#1769E0]" />
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
              Waiting Customers for {user?.counterNumber || 'Counter 03'}
            </h3>
          </div>

          <Link
            to="/staff/queue"
            className="text-xs font-semibold text-[#1769E0] hover:underline flex items-center gap-1"
          >
            <span>Full Branch Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {waitingQueue.length === 0 ? (
          <div className="py-12 text-center text-[#64748B] font-medium text-sm">
            <Users className="w-10 h-10 mx-auto mb-2 text-[#CBD5E1]" />
            <p className="text-[#172033] font-bold">All assigned customers have been served.</p>
            <p className="text-xs text-[#64748B] mt-1">Reception Desk will assign next arriving customers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold bg-[#F8FAFC]">
                  <th className="py-3 px-3">Pos</th>
                  <th className="py-3 px-3">Token</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Waiting</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {waitingQueue.map((cust: WaitingCustomer, idx: number) => {
                  const isFirst = idx === 0;
                  return (
                    <tr
                      key={cust.token_id}
                      className={`transition-colors ${
                        isFirst
                          ? 'bg-[#EFF6FF] border-l-4 border-l-[#1769E0] font-semibold'
                          : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            isFirst
                              ? 'bg-[#1769E0] text-white'
                              : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                          }`}
                        >
                          {cust.position || idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-sm font-bold text-[#172033] tracking-wide">
                        {cust.token_id}
                        {isFirst && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1769E0] text-white uppercase font-sans">
                            Next
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-sans font-medium text-[#172033]">
                        {cust.customer_name || `Customer #${cust.token_id.replace(/\D/g, '') || '01'}`}
                      </td>
                      <td className="py-3.5 px-3 font-sans text-[#64748B]">
                        {cust.service_type || 'Account Service'}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#16A34A]">
                        {cust.estimated_wait || `~${(idx + 1) * 3} min`}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="px-2.5 py-1 rounded-full bg-white text-[#1769E0] font-bold text-[10px] border border-[#BFDBFE]">
                          {cust.status || 'WAITING'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Helper Footer */}
      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
        <span className="font-bold text-[#172033]">Keyboard Shortcuts:</span>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] text-[#1769E0] font-bold">
            [N] New Token
          </span>
          <span className="bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A] text-[#D97706] font-bold">
            [C] Call Next
          </span>
          <span className="bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] text-[#1769E0] font-bold">
            [S] Start Service
          </span>
          <span className="bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC] text-[#16A34A] font-bold">
            [D] Complete Service
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TOKEN GENERATION MODAL / FORM */}
      {/* ==================================================================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#1769E0]" />
                <h3 className="text-base font-bold text-[#172033]">Generate Customer Token</h3>
              </div>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setGeneratedConfirmation(null);
                }}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedConfirmation ? (
              <div className="text-center py-6">
                <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
                  TOKEN GENERATED
                </span>
                <div className="text-5xl font-black font-mono text-[#1769E0] mb-2">
                  {generatedConfirmation}
                </div>
                <p className="text-xs text-[#64748B] mb-6 font-medium">
                  Please wait for your token to be called on the display screen.
                </p>
                <button
                  onClick={() => {
                    setGeneratedConfirmation(null);
                    setShowGenerateModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#1769E0] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1558BD] cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#172033] focus:outline-none focus:border-[#1769E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +1 555 0192"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#172033] focus:outline-none focus:border-[#1769E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase mb-1">
                    Service Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#172033] focus:outline-none focus:border-[#1769E0]"
                  >
                    <option value="Account Service">Account Service & Openings</option>
                    <option value="Cash Deposit">Cash Deposit & Withdrawal</option>
                    <option value="Priority Assistance">Priority / Senior Citizens</option>
                    <option value="Loans & Advisory">Loans & Advisory</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction === 'GENERATE'}
                    className="px-5 py-2.5 rounded-xl bg-[#1769E0] hover:bg-[#1558BD] text-white font-bold text-xs uppercase tracking-wider shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === 'GENERATE' ? 'Generating...' : 'Issue Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
