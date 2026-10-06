import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TelemetryData, GenerateTokenPayload } from '../types/queue';
import { useQueueWebSocket } from '../hooks/useQueueWebSocket';
import { api } from '../services/api';

interface QueueContextType {
  telemetry: TelemetryData | null;
  history: TelemetryData[];
  isConnected: boolean;
  isReconnecting: boolean;
  lastFeedback: string | null;
  loadingAction: string | null;
  announcements: string[];
  generateToken: (payload?: GenerateTokenPayload) => Promise<any>;
  callNext: (counter?: number) => Promise<any>;
  startService: (counter?: number) => Promise<any>;
  completeService: (counter?: number) => Promise<any>;
  testHardware: (level: string) => Promise<any>;
  addAnnouncement: (text: string) => void;
  removeAnnouncement: (index: number) => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const DEFAULT_ANNOUNCEMENTS = [
  'Welcome to Smart Bank Central — Please register at the Reception Desk to receive your token.',
  'Senior Citizens & Specially-Abled Customers may request Priority Assistance at Counter 01.',
  'Self-service Cash Deposit and Passbook Printing Kiosks are available 24/7 in the e-Lobby.',
  'Please keep your Account Number, Photo ID, and required verification documents ready.',
];

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { telemetry, history, isConnected, isReconnecting } = useQueueWebSocket();
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>(DEFAULT_ANNOUNCEMENTS);

  const showFeedback = (msg: string, duration = 3000) => {
    setLastFeedback(msg);
    setTimeout(() => {
      setLastFeedback(null);
    }, duration);
  };

  const generateToken = useCallback(async (payload?: GenerateTokenPayload) => {
    try {
      setLoadingAction('GENERATE');
      const res = await api.generateToken(payload);
      const nameStr = res.customer_name ? ` for ${res.customer_name}` : '';
      const counterStr = res.assigned_counter ? ` (Counter ${res.assigned_counter < 10 ? '0' : ''}${res.assigned_counter})` : '';
      showFeedback(`Token Issued: ${res.token_id || 'New Token'}${nameStr}${counterStr}`);
      return res;
    } catch (err: any) {
      showFeedback(`Failed to generate token: ${err.message || 'Error'}`);
      throw err;
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const callNext = useCallback(async (counter?: number) => {
    try {
      setLoadingAction('CALL_NEXT');
      const res = await api.callNext(counter);
      if (res.token_id) {
        const counterStr = counter ? ` to Counter ${counter < 10 ? '0' : ''}${counter}` : '';
        const nameStr = res.customer_name ? ` (${res.customer_name})` : '';
        showFeedback(`Called Customer: ${res.token_id}${nameStr}${counterStr}`);
      } else {
        showFeedback(counter ? `No waiting customers for Counter ${counter < 10 ? '0' : ''}${counter}` : 'No waiting customers in queue');
      }
      return res;
    } catch (err: any) {
      showFeedback(`Failed to call next token: ${err.message || 'Error'}`);
      throw err;
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const startService = useCallback(async (counter?: number) => {
    try {
      setLoadingAction('START_SERVICE');
      const res = await api.startService(counter);
      if (res.token_id) {
        showFeedback(`Started Service: ${res.token_id}`);
      } else {
        showFeedback('No token ready for service');
      }
      return res;
    } catch (err: any) {
      showFeedback(`Failed to start service: ${err.message || 'Error'}`);
      throw err;
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const completeService = useCallback(async (counter?: number) => {
    try {
      setLoadingAction('COMPLETE_SERVICE');
      const res = await api.completeService(counter);
      if (res.token_id) {
        showFeedback(`Completed Service: ${res.token_id}`);
      } else {
        showFeedback('No active service to complete');
      }
      return res;
    } catch (err: any) {
      showFeedback(`Failed to complete service: ${err.message || 'Error'}`);
      throw err;
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const testHardware = useCallback(async (level: string) => {
    try {
      setLoadingAction(`TEST_${level}`);
      const res = await api.testHardwareLevel(level);
      showFeedback(`ESP32 Test "${level}" dispatched: ${res.result?.status || 'OK'}`);
      return res;
    } catch (err: any) {
      showFeedback(`ESP32 Test failed: ${err.message || 'Error'}`);
      throw err;
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const addAnnouncement = (text: string) => {
    if (!text.trim()) return;
    setAnnouncements((prev) => [...prev, text.trim()]);
    showFeedback('Announcement added');
  };

  const removeAnnouncement = (index: number) => {
    setAnnouncements((prev) => prev.filter((_, i) => i !== index));
    showFeedback('Announcement removed');
  };

  return (
    <QueueContext.Provider
      value={{
        telemetry,
        history,
        isConnected,
        isReconnecting,
        lastFeedback,
        loadingAction,
        announcements,
        generateToken,
        callNext,
        startService,
        completeService,
        testHardware,
        addAnnouncement,
        removeAnnouncement,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
