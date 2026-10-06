import type {
  GenerateTokenPayload,
  CounterInfo,
  CounterRecommendation,
  ReportSummaryResponse,
} from '../types/queue';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Token Controls
  async generateToken(payload?: GenerateTokenPayload): Promise<{
    status: string;
    token_id: string;
    token_status: string;
    customer_name?: string;
    mobile_number?: string;
    service_type?: string;
    assigned_counter?: number;
    customer_id?: string;
    created_at?: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) throw new Error('Failed to generate token');
    return res.json();
  },

  async callNext(counter?: number): Promise<{
    status: string;
    token_id: string | null;
    token_status?: string;
    assigned_counter?: number;
    customer_name?: string;
    service_type?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/call_next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(counter ? { counter } : {}),
    });
    if (!res.ok) throw new Error('Failed to call next token');
    return res.json();
  },

  async startService(counter?: number): Promise<{
    status: string;
    token_id: string | null;
    token_status?: string;
    assigned_counter?: number;
    customer_name?: string;
    service_type?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/start_service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(counter ? { counter } : {}),
    });
    if (!res.ok) throw new Error('Failed to start service');
    return res.json();
  },

  async completeService(counter?: number): Promise<{
    status: string;
    token_id: string | null;
    token_status?: string;
    assigned_counter?: number;
    customer_name?: string;
    service_type?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/complete_service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(counter ? { counter } : {}),
    });
    if (!res.ok) throw new Error('Failed to complete service');
    return res.json();
  },

  async skipToken(counter?: number): Promise<{
    status: string;
    token_id: string | null;
    token_status?: string;
    assigned_counter?: number;
    customer_name?: string;
    service_type?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/skip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(counter ? { counter } : {}),
    });
    if (!res.ok) throw new Error('Failed to skip token');
    return res.json();
  },

  async getCounters(): Promise<{ counters: CounterInfo[] }> {
    const res = await fetch(`${API_BASE_URL}/api/counters`);
    if (!res.ok) throw new Error('Failed to fetch counters');
    return res.json();
  },

  async getCounterRecommendation(serviceType: string): Promise<CounterRecommendation> {
    const res = await fetch(`${API_BASE_URL}/api/counters/recommend?service_type=${encodeURIComponent(serviceType)}`);
    if (!res.ok) throw new Error('Failed to fetch counter recommendation');
    return res.json();
  },

  // Diagnostics & Status
  async getStatus() {
    const res = await fetch(`${API_BASE_URL}/api/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async getCrowdStatus() {
    const res = await fetch(`${API_BASE_URL}/api/crowd/status`);
    if (!res.ok) throw new Error('Failed to fetch crowd status');
    return res.json();
  },

  async getAlerts() {
    const res = await fetch(`${API_BASE_URL}/api/alerts`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async getQueue() {
    const res = await fetch(`${API_BASE_URL}/api/queue`);
    if (!res.ok) throw new Error('Failed to fetch queue');
    return res.json();
  },

  async getPublicQueue() {
    const res = await fetch(`${API_BASE_URL}/api/queue/public`);
    if (!res.ok) throw new Error('Failed to fetch public queue');
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE_URL}/api/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getHardwareStatus() {
    const res = await fetch(`${API_BASE_URL}/api/hardware/status`);
    if (!res.ok) throw new Error('Failed to fetch hardware status');
    return res.json();
  },

  async testHardwareLevel(level: string) {
    const res = await fetch(`${API_BASE_URL}/api/hardware/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
    if (!res.ok) throw new Error('Failed to dispatch hardware test');
    return res.json();
  },

  // Audit Reports & Export
  async getReportSummary(period: string = 'today'): Promise<ReportSummaryResponse> {
    const res = await fetch(`${API_BASE_URL}/api/reports/summary?period=${encodeURIComponent(period)}`);
    if (!res.ok) throw new Error('Failed to fetch report summary');
    return res.json();
  },

  getExportReportUrl(period: string = 'today', format: string = 'csv'): string {
    return `${API_BASE_URL}/api/reports/export?format=${encodeURIComponent(format)}&period=${encodeURIComponent(period)}`;
  },

  // Thresholds
  async getThresholds(): Promise<{ normal_max: number; moderate_max: number; high_min: number }> {
    const res = await fetch(`${API_BASE_URL}/api/config/thresholds`);
    if (!res.ok) throw new Error('Failed to fetch thresholds');
    return res.json();
  },

  async setThresholds(normalMax: number, moderateMax: number): Promise<{ normal_max: number; moderate_max: number; high_min: number }> {
    const res = await fetch(`${API_BASE_URL}/api/config/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ normal_max: normalMax, moderate_max: moderateMax }),
    });
    if (!res.ok) throw new Error('Failed to update thresholds');
    return res.json();
  },

  getVideoFeedUrl(): string {
    return `${API_BASE_URL}/api/video_feed`;
  }
};
