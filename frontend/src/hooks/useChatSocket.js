/**
 * WebSocket con reconexión exponencial, heartbeat y cola de mensajes offline.
 * Utiliza handlersRef para evitar loops infinitos de re-render en React.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/lib/api";

function getDefaultWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }
  return "ws://localhost:8000";
}

const MAX_RETRY = 8;
const HEARTBEAT_MS = 25000;

export function useChatSocket(handlers = {}) {
  const ref = useRef(null);
  const retryRef = useRef(0);
  const timerRef = useRef(null);
  const queueRef = useRef([]);
  const hbRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Mantener handlers en un ref mutable para no recrear connect() en cada render
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;

    // Si ya existe conexión abierta o conectándose, no duplicar
    if (ref.current && (ref.current.readyState === WebSocket.OPEN || ref.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getDefaultWsUrl();
    const ws = new WebSocket(`${wsUrl}/api/v1/chat/ws?token=${encodeURIComponent(token)}`);
    ref.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryRef.current = 0;
      clearInterval(hbRef.current);
      hbRef.current = setInterval(() => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        } catch { /* ignore */ }
      }, HEARTBEAT_MS);

      // Despachar mensajes en cola acumulados offline
      while (queueRef.current.length) {
        const item = queueRef.current.shift();
        try { ws.send(item); } catch { break; }
      }
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const h = handlersRef.current;
        if (data.type === "token") h.onToken?.(data.text);
        else if (data.type === "citation") h.onCitation?.(data.citation);
        else if (data.type === "ticket") h.onTicket?.(data);
        else if (data.type === "chat_id") h.onChatId?.(data.chat_id);
        else if (data.type === "done") h.onDone?.(data);
        else if (data.type === "error") h.onError?.(data.detail || "Error en el chat");
      } catch (e) {
        console.warn("WS parse error", e);
      }
    };

    ws.onclose = (ev) => {
      setConnected(false);
      clearInterval(hbRef.current);
      // Solo reconectar si no fue cierre limpio intencional (código 1000)
      if (ev.code !== 1000) {
        const delay = Math.min(30000, 1000 * 2 ** retryRef.current);
        retryRef.current = Math.min(retryRef.current + 1, MAX_RETRY);
        timerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      try { ws.close(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(hbRef.current);
      if (ref.current) {
        try { ref.current.close(1000, "Component unmounted"); } catch { /* ignore */ }
      }
    };
  }, [connect]);

  const send = useCallback((message, chatId) => {
    const payload = JSON.stringify({ message, chat_id: chatId });
    const ws = ref.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    } else {
      queueRef.current.push(payload);
      connect();
    }
  }, [connect]);

  return { send, connected };
}