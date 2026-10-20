import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { chatApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/ui";
import { useChatSocket } from "@/hooks/useChatSocket";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatHistoryList from "@/components/chat/ChatHistoryList";
import "./chat.css";

export default function Chat() {
  const { user } = useAuth();
  const toast = useToast();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const endRef = useRef(null);

  // Handlers memoizados para useChatSocket
  const socketHandlers = useMemo(() => ({
    onChatId: (id) => setChatId(id),
    onToken: (t) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          return [...prev.slice(0, -1), { ...last, content: last.content + t }];
        }
        return [...prev, { role: "assistant", content: t, streaming: true, citations: [] }];
      });
    },
    onCitation: (c) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const exists = (last.citations || []).some((x) => x.index === c.index);
        if (exists) return prev;
        return [...prev.slice(0, -1), { ...last, citations: [...(last.citations || []), c] }];
      });
    },
    onTicket: (tk) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        return [...prev.slice(0, -1), { ...last, ticket: tk }];
      });
    },
    onDone: (meta) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        return [...prev.slice(0, -1), { ...last, streaming: false, ...meta }];
      });
    },
    onError: (msg) => toast.error(msg),
  }), [toast]);

  const { send, connected } = useChatSocket(socketHandlers);

  // Auto-scroll seguro sin trigger de loop infinito
  const messagesLen = messages.length;
  const lastContentLen = messages[messages.length - 1]?.content?.length || 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesLen, lastContentLen]);

  const submit = useCallback((text) => {
    setMessages((m) => [...m, { role: "user", content: text }]);
    send(text, chatId);
  }, [send, chatId]);

  const openChat = async (id) => {
    try {
      const data = await chatApi.chat(id);
      setChatId(id);
      setMessages(
        data.messages.map((m) => ({
          message_id: m.id,
          role: m.role,
          content: m.content,
          citations: m.citations,
          streaming: false,
        }))
      );
      setHistoryOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const newChat = () => {
    setChatId(null);
    setMessages([]);
    setHistoryOpen(false);
  };

  const suggestions = [
    { icon: "🔐", text: "¿Cuál es la política de complejidad y cambio de contraseñas?" },
    { icon: "🎣", text: "¿Cómo reporto un correo sospechoso de phishing?" },
    { icon: "💾", text: "¿Está permitido conectar dispositivos USB personales?" },
    { icon: "🚨", text: "He detectado una fuga de información confidencial en un enlace público" },
  ];

  return (
    <div className="chat-layout">
      {/* Sidebar de historial */}
      <aside className={`chat-side ${historyOpen ? "open" : ""}`}>
        <div className="chat-side-header">
          <span className="chat-side-title">Historial</span>
          <Button size="xs" variant="primary" onClick={newChat}>
            + Nueva
          </Button>
        </div>
        <div className="chat-side-body">
          <ChatHistoryList onSelect={openChat} activeId={chatId} />
        </div>
      </aside>

      {/* Área principal del chat */}
      <section className="chat-main">
        <header className="chat-head">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setHistoryOpen((v) => !v)}
            title="Mostrar u ocultar historial"
          >
            {historyOpen ? "✕ Cerrar Historial" : "💬 Conversaciones"}
          </Button>

          <div className="chat-status">
            <span className={`dot ${connected ? "dot-ok" : "dot-bad"}`} aria-hidden="true" />
            <span>{connected ? "SecBot Conectado" : "Reconectando WebSocket..."}</span>
          </div>
        </header>

        <div className="chat-body" role="log" aria-live="polite" aria-label="Conversación">
          {messages.length === 0 && (
            <div className="chat-intro">
              <div className="chat-intro-badge">✨ Asistente Corporativo RAG</div>
              <h2>Hola, {user?.full_name?.split(" ")[0] || "colega"} 👋</h2>
              <p>
                Resuelvo consultas sobre políticas de seguridad, runbooks, reportes de incidentes y normativas internas con respuestas citadas y verificadas.
              </p>

              <div className="chat-suggestions">
                {suggestions.map((s) => (
                  <button
                    key={s.text}
                    className="chip"
                    onClick={() => submit(s.text)}
                    title="Enviar pregunta frecuente"
                  >
                    <span>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <ChatMessage key={m.message_id || i} message={m} />
          ))}
          <div ref={endRef} />
        </div>

        <ChatComposer onSend={submit} disabled={!connected} />
      </section>
    </div>
  );
}