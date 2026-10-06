import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
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
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { WaitingCustomer, CounterInfo } from '../../types/queue';

export const StaffDashboardPage: React.FC = () => {
  const {
    telemetry,
    generateToken,
    callNext,
    startService,
    completeService,
    skipToken,
    loadingAction,
  } = useQueue();
  const { user } = useAuth();

  // Modals state
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState('Account Service');
  const [generatedConfirmation, setGeneratedConfirmation] = useState<string | null>(null);

  // Live timer tick for active service
  const [nowTime, setNowTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Extract counter number from user profile (e.g. "Counter 03" -> 3)
  const counterNum = useMemo(() => {
    const match = user?.counterNumber?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
  }, [user?.counterNumber]);

  // Find this specific counter's live data from telemetry counters
  const currentCounterInfo = useMemo(() => {
    const counters: CounterInfo[] = telemetry?.counters ?? [];
    return counters.find((c) => c.counter === counterNum);
  }, [telemetry?.counters, counterNum]);

  // Active token for this counter (either from counters info or fallback)
  const activeToken = useMemo(() => {
    if (currentCounterInfo?.active_token) {
      return currentCounterInfo.active_token;
    }
    // Fallback if legacy single token matches
    const servingId = telemetry?.serving_token_id !== 'None' ? telemetry?.serving_token_id : null;
    const currentId = servingId || (telemetry?.current_token !== 'None' ? telemetry?.current_token : null);
    if (currentId) {
      return {
        token_id: currentId,
        status: (servingId ? 'SERVING' : 'CALLED') as 'SERVING' | 'CALLED',
        customer_name: '',
        service_type: 'General Banking',
        assigned_counter: counterNum,
        called_at: 0,
        service_start_at: servingId ? 0 : undefined,
      };
    }
    return null;
  }, [currentCounterInfo, telemetry?.serving_token_id, telemetry?.current_token, counterNum]);

  const isCalled = activeToken?.status === 'CALLED';
  const isServing = activeToken?.status === 'SERVING';
  const hasActiveCustomer = Boolean(activeToken && (isCalled || isServing));

  // Live elapsed duration calculation
  const liveElapsedStr = useMemo(() => {
    if (!activeToken) return '00:00';
    let startTimestamp = activeToken.service_start_at || (isCalled ? activeToken.called_at : null);
    if (!startTimestamp) return '00:00';
    const elapsedSec = Math.max(0, Math.floor(nowTime / 1000 - startTimestamp));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [activeToken, isCalled, nowTime]);

  // Counter-filtered waiting queue
  const waitingQueue = useMemo(() => {
    const allWaiting = telemetry?.waiting_queue ?? [];
    const counterSpecific = allWaiting.filter(
      (item) => item.assigned_counter === undefined || item.assigned_counter === counterNum
    );
    return counterSpecific.length > 0 ? counterSpecific : allWaiting;
  }, [telemetry?.waiting_queue, counterNum]);

  // Identify the FIRST customer waiting for this counter
  const nextCustomer = waitingQueue.length > 0 ? waitingQueue[0] : null;

  // Keyboard shortcut listener for rapid counter operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toUpperCase();
      if (key === 'N') {
        e.preventDefault();
        setShowGenerateModal(true);
      } else if (key === 'C') {
        e.preventDefault();
        if (nextCustomer && !hasActiveCustomer) {
          callNext(counterNum);
        }
      } else if (key === 'S') {
        e.preventDefault();
        if (isCalled) {
          startService(counterNum);
        }
      } else if (key === 'D') {
        e.preventDefault();
        if (isServing) {
          setShowCompleteConfirm(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCustomer, hasActiveCustomer, isCalled, isServing, counterNum, callNext, startService]);

  const handleConfirmComplete = async () => {
    try {
      await completeService(counterNum);
      setShowCompleteConfirm(false);
    } catch {
      // Feedback handled in QueueContext
    }
  };

  const handleSkip = async () => {
    if (activeToken) {
      await skipToken(counterNum);
    }
  };

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* 1. Header Banner */}
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
            Officer: <span className="font-semibold text-[#172033]">{user?.name || 'Sarah Jenkins'}</span> &bull; Follow the structured workflow to serve assigned customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge level={telemetry?.congestion_level} size="md" />
          <span className="text-xs font-mono font-bold text-[#64748B] bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
            {waitingQueue.length} In Assigned Queue
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. CURRENT SERVICE CARD (NOW SERVING) */}
      {/* ==================================================================== */}
      <div className={`rounded-2xl bg-white border-2 transition-all p-6 sm:p-8 shadow-sm relative overflow-hidden ${
        isServing
          ? 'border-[#06B6D4] ring-2 ring-[#E0F2FE]'
          : isCalled
          ? 'border-[#F59E0B] ring-2 ring-[#FEF3C7]'
          : 'border-[#E2E8F0]'
      }`}>
        {/* Top Highlight Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          isServing ? 'bg-[#06B6D4]' : isCalled ? 'bg-[#F59E0B]' : 'bg-[#CBD5E1]'
        }`} />

        {/* Card Header & Status Badge */}
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${
              isServing
                ? 'bg-[#06B6D4] animate-pulse'
                : isCalled
                ? 'bg-[#F59E0B] animate-pulse'
                : 'bg-[#94A3B8]'
            }`} />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#172033]">
              CURRENT SERVICE AT {user?.counterNumber?.toUpperCase() || 'COUNTER 03'}
            </h3>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            isServing
              ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
              : isCalled
              ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
          }`}>
            {isServing ? 'SERVICE IN PROGRESS' : isCalled ? 'CALLED — AWAITING ARRIVAL' : 'COUNTER READY'}
          </span>
        </div>

        {/* Customer Content */}
        {hasActiveCustomer ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Token ID and Customer Name (7 Cols) */}
              <div className="md:col-span-7">
                <span className="text-xs font-bold uppercase tracking-widest text-[#64748B] block mb-1">
                  NOW SERVING
                </span>
                <div className="text-5xl sm:text-6xl font-black font-mono text-[#172033] tracking-tight">
                  {activeToken?.token_id}
                </div>
                <div className="mt-2 space-y-1">
                  <div className="text-base font-bold text-[#172033]">
                    {activeToken?.customer_name || `Customer #${activeToken?.token_id.replace(/\D/g, '') || '01'}`}
                  </div>
                  <div className="text-xs text-[#64748B] font-medium flex items-center gap-2">
                    <span>Service: <strong className="text-[#172033]">{activeToken?.service_type || 'General Banking'}</strong></span>
                    <span>&bull;</span>
                    <span>Desk: <strong className="text-[#1769E0] font-mono">{user?.counterNumber || 'Counter 03'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Service Duration Counter (5 Cols) */}
              <div className="md:col-span-5 bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0] text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  <Clock className="w-4 h-4 text-[#1769E0]" />
                  <span>Service Duration</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-[#172033] tracking-wider">
                  {liveElapsedStr}
                </div>
                <span className="text-[11px] text-[#64748B] mt-1 block font-medium">
                  {isServing ? 'Live consultation timer' : 'Timer activates upon service start'}
                </span>
              </div>
            </div>

            {/* Workflow Action Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-[#F1F5F9]">
              {/* START SERVICE BUTTON (Enabled when CALLED, disabled when SERVING) */}
              <div className="sm:col-span-4">
                <button
                  type="button"
                  onClick={() => startService(counterNum)}
                  disabled={loadingAction !== null || !isCalled}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-2xs ${
                    isCalled
                      ? 'bg-[#1769E0] hover:bg-[#1558BD] text-white shadow-md cursor-pointer'
                      : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed opacity-50'
                  }`}
                >
                  {loadingAction === 'START_SERVICE' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>START SERVICE [S]</span>
                </button>
              </div>

              {/* COMPLETE SERVICE BUTTON (Primary Action when IN SERVICE, Confirmation modal trigger) */}
              <div className="sm:col-span-6">
                <button
                  type="button"
                  onClick={() => setShowCompleteConfirm(true)}
                  disabled={loadingAction !== null || !isServing}
                  className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
                    isServing
                      ? 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md hover:shadow-lg active:scale-98 cursor-pointer ring-2 ring-[#86EFAC]'
                      : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed opacity-50'
                  }`}
                >
                  {loadingAction === 'COMPLETE_SERVICE' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span>✓ COMPLETE SERVICE [D]</span>
                </button>
              </div>

              {/* SKIP TOKEN BUTTON */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loadingAction !== null}
                  className="w-full flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  title="Mark token as skipped and proceed"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>SKIP</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Idle Counter State */
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1769E0] mx-auto">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-black text-[#172033] uppercase">
                COUNTER READY &bull; NO ACTIVE CUSTOMER
              </h4>
              <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
                Your counter is idle. Check the <span className="font-bold text-[#1769E0]">NEXT CUSTOMER</span> section below and click <span className="font-bold text-[#1769E0]">CALL NEXT</span> to begin service.
              </p>
            </div>

            {/* Disabled Complete button to indicate workflow requirement */}
            <div className="pt-3 max-w-xs mx-auto">
              <button
                type="button"
                disabled
                className="w-full py-2.5 px-4 rounded-xl bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] text-xs font-bold uppercase tracking-wider cursor-not-allowed"
              >
                COMPLETE SERVICE (No Active Token)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. NEXT CUSTOMER CARD & COUNTER STATS */}
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
                  NEXT CUSTOMER IN LINE
                </h3>
              </div>

              {nextCustomer ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
                  Position #1 in Queue
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                  Queue Empty
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

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl text-xs space-y-1.5 sm:min-w-[240px]">
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
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span>Counter:</span>
                    <strong className="text-[#1769E0] font-mono">{user?.counterNumber || 'Counter 03'}</strong>
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
                  Reception desk will automatically assign new arriving customers.
                </p>
              </div>
            )}
          </div>

          {/* Primary Call Action Button */}
          <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
            <button
              onClick={() => callNext(counterNum)}
              disabled={loadingAction !== null || !nextCustomer || hasActiveCustomer}
              className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider shadow-sm transition-all ${
                nextCustomer && !hasActiveCustomer
                  ? 'bg-[#1769E0] hover:bg-[#1558BD] text-white active:scale-98 cursor-pointer shadow-md'
                  : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed opacity-60'
              }`}
            >
              {loadingAction === 'CALL_NEXT' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Megaphone className="w-5 h-5" />
              )}
              <span>
                {nextCustomer
                  ? hasActiveCustomer
                    ? `FINISH CURRENT SERVICE FIRST BEFORE CALLING ${nextCustomer.token_id}`
                    : `CALL NEXT [C] (${nextCustomer.token_id})`
                  : 'NO CUSTOMERS WAITING'}
              </span>
            </button>
          </div>
        </div>

        {/* COUNTER WORKFLOW HELPER & QUICK TICKET (4 Columns) */}
        <div className="lg:col-span-4 rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1769E0]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Service Workflow
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#16A34A] font-bold bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                Step Guide
              </span>
            </div>

            {/* Step-by-step guidance */}
            <div className="space-y-2.5 text-xs mb-4">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                !hasActiveCustomer ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1769E0] font-bold' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
              }`}>
                <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center font-mono text-[10px] shrink-0">1</span>
                <span>Call Next Customer [C]</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                isCalled ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706] font-bold' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
              }`}>
                <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center font-mono text-[10px] shrink-0">2</span>
                <span>Start Service on Arrival [S]</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                isServing ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A] font-bold' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
              }`}>
                <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center font-mono text-[10px] shrink-0">3</span>
                <span>Complete Service on Finish [D]</span>
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
      {/* 4. WAITING CUSTOMERS IN QUEUE TABLE */}
      {/* ==================================================================== */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-[#1769E0]" />
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
              Assigned Queue for {user?.counterNumber || 'Counter 03'}
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

      {/* 5. Keyboard Shortcuts Helper Footer */}
      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
        <span className="font-bold text-[#172033]">Keyboard Shortcuts:</span>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] text-[#1769E0] font-bold">
            [C] Call Next
          </span>
          <span className="bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] text-[#1769E0] font-bold">
            [S] Start Service
          </span>
          <span className="bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC] text-[#16A34A] font-bold">
            [D] Complete Service
          </span>
          <span className="bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#CBD5E1] text-[#64748B] font-bold">
            [N] Manual Token
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. COMPLETE SERVICE CONFIRMATION DIALOG */}
      {/* ==================================================================== */}
      {showCompleteConfirm && activeToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#BFDBFE] shadow-2xl max-w-md w-full p-6 sm:p-8 relative text-center space-y-6">
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#172033] tracking-tight">
                Complete this customer's service?
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                This will finalize the consultation, log the service duration, and make your counter ready for the next customer.
              </p>
            </div>

            {/* Consultation Summary */}
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-xs space-y-2.5 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Customer:</span>
                <strong className="text-[#172033] text-sm">
                  {activeToken.customer_name || `Customer #${activeToken.token_id.replace(/\D/g, '') || '01'}`}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Token ID:</span>
                <strong className="text-[#1769E0] font-mono text-base">{activeToken.token_id}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-medium">Service:</span>
                <strong className="text-[#172033]">{activeToken.service_type || 'Account Opening'}</strong>
              </div>
              <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-2">
                <span className="text-[#64748B] font-medium">Recorded Duration:</span>
                <strong className="text-[#16A34A] font-mono">{liveElapsedStr}</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteConfirm(false)}
                disabled={loadingAction === 'COMPLETE_SERVICE'}
                className="py-3 px-4 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-bold text-[#64748B] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={loadingAction === 'COMPLETE_SERVICE'}
                className="py-3 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'COMPLETE_SERVICE' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Service</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. MANUAL TOKEN GENERATION MODAL */}
      {/* ==================================================================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#1769E0]" />
                <h3 className="text-base font-bold text-[#172033]">Manual Walk-in Ticket</h3>
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
                  Assigned to {user?.counterNumber || 'Counter 03'}.
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
                    <option value="Account Service">Account Service & Maintenance</option>
                    <option value="Account Opening">New Account Opening</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="Cash Withdrawal">Cash Withdrawal</option>
                    <option value="Loan Enquiry">Loans & Advisory</option>
                    <option value="General Banking">General Banking</option>
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
                    {loadingAction === 'GENERATE' ? 'Issuing...' : 'Issue Token'}
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
