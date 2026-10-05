import { useState, useEffect, useRef, useCallback } from 'react';
import type { TelemetryData } from '../types/queue';

const WS_URL = 'ws://localhost:8000/ws';
const MAX_CHART_HISTORY = 40;

export function useQueueWebSocket() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef<boolean>(false);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) return;
        setIsConnected(true);
        setIsReconnecting(false);
        console.log('[WS] Connected to queue telemetry stream');
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const data: TelemetryData = JSON.parse(event.data);
          setTelemetry(data);

          setHistory((prev) => {
            const updated = [...prev, data];
            if (updated.length > MAX_CHART_HISTORY) {
              return updated.slice(updated.length - MAX_CHART_HISTORY);
            }
            return updated;
          });
        } catch (err) {
          console.error('[WS] Error parsing telemetry payload:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] WebSocket error:', err);
      };

      ws.onclose = () => {
        if (isUnmountedRef.current) return;
        setIsConnected(false);
        setIsReconnecting(true);
        console.warn('[WS] Connection closed. Reconnecting in 2 seconds...');

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };
    } catch (e) {
      console.error('[WS] Connection attempt failed:', e);
      setIsConnected(false);
      setIsReconnecting(true);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    }
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    telemetry,
    history,
    isConnected,
    isReconnecting,
  };
}
