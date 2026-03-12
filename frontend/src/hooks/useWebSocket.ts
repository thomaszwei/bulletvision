import { useEffect, useRef, useCallback } from "react";
import type { WSEvent } from "@/types";

const WS_BASE = (() => {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${proto}//${host}`;
})();

interface UseWebSocketOptions {
  sessionId: number | null;
  onEvent: (event: WSEvent) => void;
  enabled?: boolean;
}

export function useWebSocket({ sessionId, onEvent, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) return;

    const url = `${WS_BASE}/ws/session/${sessionId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Keepalive ping every 20s
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 20_000);
      (ws as unknown as { _ping: ReturnType<typeof setInterval> })._ping = pingInterval;
    };

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
        onEvent(event);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      // Auto-reconnect after 3s
      reconnectTimer.current = setTimeout(connect, 3_000);
    };

    ws.onerror = () => ws.close();
  }, [sessionId, enabled, onEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
