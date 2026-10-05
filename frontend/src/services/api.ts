const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Token Controls
  async generateToken(): Promise<{ status: string; token_id: string }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/generate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate token');
    return res.json();
  },

  async callNext(): Promise<{ status: string; token_id: string | null }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/call_next`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to call next token');
    return res.json();
  },

  async startService(): Promise<{ status: string; token_id: string | null }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/start_service`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start service');
    return res.json();
  },

  async completeService(): Promise<{ status: string; token_id: string | null }> {
    const res = await fetch(`${API_BASE_URL}/api/tokens/complete_service`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete service');
    return res.json();
  },

  // Queries
  async getStatus() {
    const res = await fetch(`${API_BASE_URL}/api/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
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

  getVideoFeedUrl(): string {
    return `${API_BASE_URL}/api/video_feed`;
  }
};
