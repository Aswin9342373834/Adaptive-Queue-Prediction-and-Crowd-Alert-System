import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  UserCheck,
  Users,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Tv,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'manager' | 'receptionist' | 'staff'>('receptionist');
  const [email, setEmail] = useState('receptionist@smartbank.com');
  const [password, setPassword] = useState('reception123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [counterNumber, setCounterNumber] = useState('Counter 03');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (role: 'manager' | 'receptionist' | 'staff') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'manager') {
      setEmail('manager@smartbank.com');
      setPassword('manager123');
    } else if (role === 'receptionist') {
      setEmail('receptionist@smartbank.com');
      setPassword('reception123');
    } else {
      setEmail('staff@smartbank.com');
      setPassword('staff123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both employee credentials.');
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      login(selectedRole, email, selectedRole === 'staff' ? counterNumber : undefined);
      setIsLoading(false);
      if (selectedRole === 'manager') {
        navigate('/manager/dashboard');
      } else if (selectedRole === 'receptionist') {
        navigate('/reception/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#172033] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#1769E0] selection:text-white">
      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[#1769E0] shadow-2xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-[#172033] uppercase block">
              Smart Bank
            </span>
            <span className="text-xs text-[#64748B] font-medium">
              Queue Intelligence & Crowd Alert System
            </span>
          </div>
        </div>

        <Link
          to="/display"
          target="_blank"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#1769E0] transition-all shadow-2xs group"
        >
          <Tv className="w-4 h-4 text-[#1769E0] group-hover:scale-110 transition-transform" />
          <span>Public TV Display</span>
        </Link>
      </header>

      {/* Main Split Layout */}
      <main className="max-w-6xl mx-auto w-full my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Branding & Value Props */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1769E0] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Banking Operations</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#172033] tracking-tight leading-tight">
            Smart Queue Management for Faster Banking Service
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Real-time customer tracking, predictive wait times, and physical counter orchestration designed to eliminate wait anxiety.
          </p>

          {/* Feature Highlights */}
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-[#DCFCE7] text-[#16A34A] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172033]">Live Computer Vision Telemetry</h4>
                <p className="text-xs text-[#64748B] mt-0.5">Automated queue density measurement and crowd flow analytics.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769E0] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172033]">Adaptive Waiting Time Estimation</h4>
                <p className="text-xs text-[#64748B] mt-0.5">Dynamic service pacing and forecast horizons up to 60 minutes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-[#172033] tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
                Sign in with your employee role credentials to continue.
              </p>
            </div>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <button
                type="button"
                onClick={() => handleRoleChange('receptionist')}
                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'receptionist'
                    ? 'bg-[#EFF6FF] border-[#1769E0] text-[#1769E0] font-bold shadow-2xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                <span className="text-[11px] uppercase tracking-wider font-extrabold">Receptionist</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('staff')}
                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'staff'
                    ? 'bg-[#EFF6FF] border-[#1769E0] text-[#1769E0] font-bold shadow-2xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[11px] uppercase tracking-wider font-extrabold">Bank Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('manager')}
                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'manager'
                    ? 'bg-[#EFF6FF] border-[#1769E0] text-[#1769E0] font-bold shadow-2xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[11px] uppercase tracking-wider font-extrabold">Manager</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1.5">
                  Employee Email or ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@smartbank.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] placeholder-[#94A3B8] text-sm font-medium focus:outline-none focus:border-[#1769E0] focus:ring-1 focus:ring-[#1769E0] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] placeholder-[#94A3B8] text-sm font-medium focus:outline-none focus:border-[#1769E0] focus:ring-1 focus:ring-[#1769E0] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#172033] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Counter Selection for Staff */}
              {selectedRole === 'staff' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1.5">
                    Assigned Counter
                  </label>
                  <select
                    value={counterNumber}
                    onChange={(e) => setCounterNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] text-sm font-medium focus:outline-none focus:border-[#1769E0] transition-colors"
                  >
                    <option value="Counter 01">Counter 01 — Priority / Senior Assistance</option>
                    <option value="Counter 02">Counter 02 — Cash & Withdrawals</option>
                    <option value="Counter 03">Counter 03 — General Banking & Accounts (Default)</option>
                    <option value="Counter 04">Counter 04 — Loans & Advisory</option>
                    <option value="Counter 05">Counter 05 — Auxiliary Rapid Counter</option>
                  </select>
                </div>
              )}

              {/* Remember Me & Demo Quick Fills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-[#64748B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#1769E0] focus:ring-0 w-4 h-4"
                  />
                  <span>Remember me</span>
                </label>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#94A3B8]">Quick Demo:</span>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('receptionist')}
                    className="px-2 py-0.5 rounded-md bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1769E0] font-bold text-[11px] border border-[#BFDBFE] cursor-pointer"
                  >
                    Receptionist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('staff')}
                    className="px-2 py-0.5 rounded-md bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1769E0] font-bold text-[11px] border border-[#BFDBFE] cursor-pointer"
                  >
                    Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('manager')}
                    className="px-2 py-0.5 rounded-md bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1769E0] font-bold text-[11px] border border-[#BFDBFE] cursor-pointer"
                  >
                    Manager
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#1769E0] hover:bg-[#1558BD] text-white font-bold text-sm tracking-wider shadow-sm active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Signing in...' : `SIGN IN AS ${selectedRole.toUpperCase()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-6 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
        Smart Bank Queue Intelligence &copy; 2026 &bull; Enterprise Banking Edition
      </footer>
    </div>
  );
};
