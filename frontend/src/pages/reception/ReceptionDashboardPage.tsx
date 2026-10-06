import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  User,
  Hash,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useQueue } from '../../context/QueueContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import type { CounterInfo, CounterRecommendation } from '../../types/queue';

const SERVICE_OPTIONS = [
  { id: 'General Banking', name: 'General Banking', category: 'General' },
  { id: 'Account Opening', name: 'New Account Opening', category: 'Accounts' },
  { id: 'Account Service', name: 'Account Maintenance & Services', category: 'Accounts' },
  { id: 'Cash Deposit', name: 'Cash Deposit', category: 'Cash' },
  { id: 'Cash Withdrawal', name: 'Cash Withdrawal', category: 'Cash' },
  { id: 'Loan Enquiry', name: 'Loan Enquiry & Processing', category: 'Loans' },
  { id: 'Financial Advisory', name: 'Financial Advisory & Investment', category: 'Advisory' },
  { id: 'KYC / Verification', name: 'KYC & Document Verification', category: 'KYC' },
  { id: 'Passbook / Statement', name: 'Passbook & Account Statement', category: 'Accounts' },
  { id: 'Priority / Senior Assistance', name: 'Priority / Senior Citizen Assistance', category: 'Priority' },
];

export const ReceptionDashboardPage: React.FC = () => {
  const { telemetry, generateToken, loadingAction } = useQueue();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [serviceType, setServiceType] = useState('Account Service');
  const [customerId, setCustomerId] = useState('');
  const [selectedCounter, setSelectedCounter] = useState<number | null>(null);

  // Recommendation & Counters
  const [recommendation, setRecommendation] = useState<CounterRecommendation | null>(null);
  const [counters, setCounters] = useState<CounterInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Confirmation Modal / Slip
  const [issuedTokenData, setIssuedTokenData] = useState<{
    token_id: string;
    customer_name: string;
    mobile_number: string;
    service_type: string;
    assigned_counter: number;
    customer_id?: string;
    estimated_wait?: string;
    created_at: number;
  } | null>(null);

  // Fetch counters & recommendation when serviceType changes or telemetry updates
  useEffect(() => {
    let isMounted = true;
    const loadCountersAndRec = async () => {
      try {
        const [cntRes, recRes] = await Promise.all([
          api.getCounters(),
          api.getCounterRecommendation(serviceType),
        ]);
        if (isMounted) {
          setCounters(cntRes.counters || []);
          setRecommendation(recRes);
          // If no manual counter selection made or selection is default, sync with recommendation
          setSelectedCounter((prev) => (prev === null ? recRes.recommended_counter : prev));
        }
      } catch (err) {
        console.error('Failed to fetch counters/recommendation:', err);
      }
    };

    loadCountersAndRec();
    return () => {
      isMounted = false;
    };
  }, [serviceType, telemetry?.tokens_waiting]);

  // Handle service type change
  const handleServiceChange = async (newService: string) => {
    setServiceType(newService);
    try {
      const rec = await api.getCounterRecommendation(newService);
      setRecommendation(rec);
      setSelectedCounter(rec.recommended_counter);
    } catch {
      // Fallback
    }
  };

  // Form Submit Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!customerName.trim()) {
      setValidationError('Please enter the customer full name.');
      return;
    }

    if (!mobileNumber.trim() || mobileNumber.trim().length < 8) {
      setValidationError('Please enter a valid mobile number (at least 8 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetCounter = selectedCounter || recommendation?.recommended_counter || 3;
      const res = await generateToken({
        customer_name: customerName.trim(),
        mobile_number: mobileNumber.trim(),
        service_type: serviceType,
        assigned_counter: targetCounter,
        customer_id: customerId.trim(),
      });

      // Calculate estimate
      const waitingCount = telemetry?.waiting_queue?.filter(
        (t) => t.assigned_counter === targetCounter
      ).length || 1;
      const estMinutes = Math.max(2, waitingCount * 3);

      setIssuedTokenData({
        token_id: res.token_id,
        customer_name: customerName.trim(),
        mobile_number: mobileNumber.trim(),
        service_type: serviceType,
        assigned_counter: targetCounter,
        customer_id: customerId.trim(),
        estimated_wait: `${estMinutes} min`,
        created_at: Date.now(),
      });

      // Reset form fields
      setCustomerName('');
      setMobileNumber('');
      setCustomerId('');
    } catch (err: any) {
      setValidationError(err.message || 'Failed to issue token. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleNewRegistration = () => {
    setIssuedTokenData(null);
  };

  // Active queue snapshot
  const activeQueue = telemetry?.waiting_queue || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#1769E0] border border-[#BFDBFE]">
              <UserPlus className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#1769E0] uppercase tracking-wider">
              Front Desk &bull; Customer Registration & Token Issuance
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#172033] tracking-tight">
            Reception Desk Portal
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Register arriving customers, assign optimal service counters, and issue digital queue tokens.
          </p>
        </div>

        {/* Quick Lobby Metrics */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs text-right">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">Waiting in Lobby</span>
            <span className="text-lg font-black text-[#172033] font-mono leading-none">
              {telemetry?.tokens_waiting ?? 0}
            </span>
          </div>
          <StatusBadge level={telemetry?.congestion_level} size="md" />
        </div>
      </div>

      {/* 2. Main 2-Column Split: Registration Form (Left) & Counter Capacity / Active Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Customer Registration Form (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1769E0]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-[#172033]">
                Customer Registration Form
              </h3>
            </div>
            <span className="text-[11px] text-[#64748B] font-medium">
              Fields marked with <span className="text-[#DC2626] font-bold">*</span> are required
            </span>
          </div>

          {validationError && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                Customer Full Name <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe, Rajesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#1769E0] focus:ring-2 focus:ring-[#EFF6FF] text-sm text-[#172033] font-medium placeholder:text-[#94A3B8] transition-all bg-white"
                />
              </div>
            </div>

            {/* Mobile Number & Customer ID (Grid 2 Cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#1769E0] focus:ring-2 focus:ring-[#EFF6FF] text-sm text-[#172033] font-mono font-medium placeholder:text-[#94A3B8] transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                  Account / ID No. <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. SB-892014"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#1769E0] focus:ring-2 focus:ring-[#EFF6FF] text-sm text-[#172033] font-mono font-medium placeholder:text-[#94A3B8] transition-all bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Service Type Selection */}
            <div>
              <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                Requested Service <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Layers className="w-4 h-4" />
                </div>
                <select
                  value={serviceType}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-[#1769E0] focus:ring-2 focus:ring-[#EFF6FF] text-sm text-[#172033] font-semibold transition-all bg-white cursor-pointer"
                >
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({opt.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Smart Recommendation Banner */}
            {recommendation && (
              <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#1769E0] text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1769E0] block">
                      Smart Counter Recommendation
                    </span>
                    <span className="text-xs font-bold text-[#172033]">
                      {recommendation.counter_name} &bull; {recommendation.officer_name}
                    </span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      {recommendation.reason}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCounter(recommendation.recommended_counter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCounter === recommendation.recommended_counter
                      ? 'bg-[#1769E0] text-white shadow-2xs'
                      : 'bg-white text-[#1769E0] border border-[#BFDBFE] hover:bg-[#EFF6FF]'
                  }`}
                >
                  {selectedCounter === recommendation.recommended_counter ? 'Selected' : 'Use Recommended'}
                </button>
              </div>
            )}

            {/* Counter Selection Grid */}
            <div>
              <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                Assign Service Counter
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {counters.map((c) => {
                  const isSelected = selectedCounter === c.counter;
                  const isRec = recommendation?.recommended_counter === c.counter;
                  return (
                    <button
                      key={c.counter}
                      type="button"
                      onClick={() => setSelectedCounter(c.counter)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#1769E0] bg-[#EFF6FF] ring-2 ring-[#BFDBFE] shadow-2xs'
                          : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      {isRec && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1769E0] text-white uppercase tracking-wider">
                          Best
                        </span>
                      )}
                      <div>
                        <span className="text-xs font-black text-[#172033] font-mono block">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-[#64748B] truncate block mt-0.5">
                          {c.officer.split(' ')[0]}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-[10px] text-[#64748B]">
                        <span>Waiting:</span>
                        <span className="font-bold text-[#172033] font-mono">
                          {c.waiting_count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || loadingAction === 'GENERATE'}
                className="flex-1 py-3.5 px-6 rounded-xl bg-[#1769E0] hover:bg-[#1558bd] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Issuing Token...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Generate & Issue Token</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerName('');
                  setMobileNumber('');
                  setCustomerId('');
                  setValidationError(null);
                }}
                className="py-3.5 px-4 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-bold text-[#64748B] transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Live Counter Capacity Snapshot & Recent Queue (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Counters Capacity Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#172033]">
                  Live Counter Status
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#1769E0]">
                {counters.length} Desks Active
              </span>
            </div>

            <div className="space-y-2.5">
              {counters.map((c) => (
                <div
                  key={c.counter}
                  className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 hover:bg-white transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#172033] font-mono">
                        {c.name}
                      </span>
                      {c.current_serving ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                          Serving {c.current_serving}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F1F5F9] text-[#64748B]">
                          Idle
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#64748B] truncate block mt-0.5">
                      {c.officer}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">Queue</span>
                    <span className="text-xs font-black text-[#172033] font-mono">
                      {c.waiting_count} waiting
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Waiting Queue Summary */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1769E0]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#172033]">
                  Waiting Queue Snapshot
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#64748B]">
                {activeQueue.length} Customers
              </span>
            </div>

            {activeQueue.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#94A3B8]">
                No customers currently waiting in the lobby.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activeQueue.slice(0, 6).map((item) => (
                  <div
                    key={item.token_id}
                    className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1769E0] font-black font-mono text-xs flex items-center justify-center shrink-0">
                        {item.position}
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-[#172033] block">
                          {item.token_id} {item.customer_name ? `(${item.customer_name})` : ''}
                        </span>
                        <span className="text-[10px] text-[#64748B] truncate block">
                          {item.service_type || 'General Banking'} &bull; Counter {item.assigned_counter ? `${item.assigned_counter < 10 ? '0' : ''}${item.assigned_counter}` : '03'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#16A34A] font-bold font-mono">
                        ~{item.estimated_wait}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Token Issuance Confirmation Modal / Print Slip */}
      {issuedTokenData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#BFDBFE] shadow-2xl max-w-md w-full p-6 sm:p-8 relative text-center space-y-6">
            {/* Bank Header */}
            <div className="flex items-center justify-center gap-2.5 text-[#1769E0]">
              <div className="p-2 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-base font-black tracking-tight uppercase block leading-none">
                  Smart Bank
                </span>
                <span className="text-[10px] text-[#64748B] font-medium">
                  Metro Central Flagship Branch
                </span>
              </div>
            </div>

            {/* Token Badge */}
            <div className="p-6 rounded-2xl bg-[#EFF6FF] border-2 border-[#1769E0] space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1769E0]">
                YOUR QUEUE TOKEN
              </span>
              <div className="text-5xl font-black text-[#172033] font-mono tracking-tight">
                {issuedTokenData.token_id}
              </div>
              <div className="pt-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1769E0] text-white inline-block">
                  Please proceed to Counter {issuedTokenData.assigned_counter < 10 ? '0' : ''}{issuedTokenData.assigned_counter}
                </span>
              </div>
            </div>

            {/* Customer & Service Details */}
            <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-[#64748B] font-medium">Customer:</span>
                <span className="font-bold text-[#172033]">{issuedTokenData.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] font-medium">Mobile:</span>
                <span className="font-mono font-bold text-[#172033]">{issuedTokenData.mobile_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B] font-medium">Service:</span>
                <span className="font-bold text-[#172033]">{issuedTokenData.service_type}</span>
              </div>
              {issuedTokenData.customer_id && (
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-medium">Reference ID:</span>
                  <span className="font-mono font-bold text-[#172033]">{issuedTokenData.customer_id}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E2E8F0] pt-2">
                <span className="text-[#64748B] font-medium">Est. Wait:</span>
                <span className="font-mono font-bold text-[#16A34A]">{issuedTokenData.estimated_wait}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintSlip}
                className="py-3 px-4 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#172033] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-[#1769E0]" />
                <span>Print Slip</span>
              </button>

              <button
                type="button"
                onClick={handleNewRegistration}
                className="py-3 px-4 rounded-xl bg-[#1769E0] hover:bg-[#1558bd] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>New Customer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
