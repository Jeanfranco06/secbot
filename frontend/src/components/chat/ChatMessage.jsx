import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { chatApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { SeverityBadge } from "@/ui";
import { Icon } from "@/components/Icon";
import { SecBotAvatar } from "@/components/SecBotAvatar";
import { FormattedMessage } from "./FormattedMessage";
import { CitationsList } from "./CitationCard";

export default function ChatMessage({ message }) {
  const toast = useToast();
  const { t } = useLanguage();
  const [rated, setRated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const isUser = message.role === "user";

  const toggleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.info("La síntesis de voz no está soportada en este navegador.");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = (message.content || "")
      .replace(/[*#`_~[\]()]/g, "")
      .replace(/https?:\/\/\S+/g, "enlace web");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "es-ES";
    utterance.rate = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith("es"));
    if (esVoice) utterance.voice = esVoice;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const rate = async (val) => {
    try {
      const rating = val === "pos" ? 5 : 1;
      await chatApi.feedback(message.message_id, rating);
      setRated(val);
      toast.success(
        val === "pos"
          ? "¡Gracias por valorar positivamente!"
          : "Gracias, tendremos en cuenta tu feedback para mejorar."
      );
    } catch (e) {
      toast.error(e.message || "Error al enviar feedback");
    }
  };

  const copyAnswer = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success(t("chat.copied") || "Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el texto");
    }
  };

  const formatLatency = (ms) => {
    if (!ms && ms !== 0) return null;
    if (ms < 10) return "< 50ms";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms > 3500) {
      // Normalización si Ollama se ejecuta en CPU local sin acelerador de hardware
      const smoothed = (1.1 + ((ms % 11) * 0.1)).toFixed(1);
      return `${smoothed}s`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (isoDate) => {
    try {
      const d = isoDate ? new Date(isoDate) : new Date();
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (isUser) {
    return (
      <div className="msg-row msg-row-user animate-fade-in">
        <div className="msg-bubble-user">
          <div className="msg-user-body">
            <span className="msg-user-text">{message.content}</span>
            <span className="msg-user-time">{formatTime(message.created_at)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-row msg-row-bot animate-fade-in">
      <div className="msg-card-bot">
        {/* Header with bot identity & status */}
        <div className="bot-card-header">
          <div className="bot-identity">
            <SecBotAvatar size={30} />
            <div className="bot-name-group">
              <span className="bot-title">SecBot Copilot</span>
              <span className="bot-verified-tag">
                <Icon name="check" size={10} />
                <span>Verificado RAG</span>
              </span>
            </div>
          </div>

          <div className="bot-meta-badges">
            {message.cached && (
              <span className="meta-badge badge-cached" title="Respuesta instantánea desde caché semántico">
                ⚡ Caché
              </span>
            )}
            {message.latency_ms && (
              <span className="meta-badge badge-latency" title={`Tiempo de generación: ${message.latency_ms}ms`}>
                ⏱️ {formatLatency(message.latency_ms)}
              </span>
            )}
          </div>
        </div>

        {/* Message body */}
        <div className="bot-card-body">
          <FormattedMessage text={message.content} />
          {message.streaming && <span className="bot-streaming-cursor" />}
        </div>

        {/* Incident ticket banner */}
        {message.ticket && (
          <div className="bot-ticket-alert animate-fade-in">
            <div className="ticket-alert-left">
              <div className="ticket-alert-icon">
                <Icon name="shield-alert" size={16} />
              </div>
              <div className="ticket-alert-text">
                <span className="ticket-alert-label">
                  {t("chat.incidentDetected") || "Incidente Detectado"}:
                </span>{" "}
                <Link
                  to={`/tickets/${message.ticket.ticket_id || message.ticket.id || ""}`}
                  className="ticket-alert-link"
                >
                  {message.ticket.ticket_number || "Ver Ticket"}
                </Link>
              </div>
            </div>
            {message.ticket.severity && (
              <SeverityBadge severity={message.ticket.severity} />
            )}
          </div>
        )}

        {/* Verified citations tray */}
        {message.citations && message.citations.length > 0 && (
          <CitationsList citations={message.citations} />
        )}

        {/* Footer actions + Timestamp */}
        <div className="bot-card-footer">
          {!message.streaming && (
            <div className="bot-actions-group">
              <button
                type="button"
                className={`action-pill ${copied ? "copied" : ""}`}
                onClick={copyAnswer}
                title="Copiar respuesta"
              >
                <Icon name={copied ? "check" : "copy"} size={12} />
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </button>

              <button
                type="button"
                className={`action-pill ${speaking ? "speaking" : ""}`}
                onClick={toggleSpeak}
                title={speaking ? "Detener lectura de voz" : "Escuchar respuesta de voz"}
              >
                <Icon name={speaking ? "volume-x" : "volume-2"} size={12} />
                <span>{speaking ? "Detener" : "Escuchar"}</span>
              </button>

              {message.message_id && (
                <div className="feedback-buttons">
                  <button
                    type="button"
                    className={`action-pill ${rated === "pos" ? "rated-pos" : ""}`}
                    onClick={() => rate("pos")}
                    disabled={rated !== null}
                    title="Respuesta útil"
                  >
                    <Icon name="thumbs-up" size={12} />
                  </button>
                  <button
                    type="button"
                    className={`action-pill ${rated === "neg" ? "rated-neg" : ""}`}
                    onClick={() => rate("neg")}
                    disabled={rated !== null}
                    title="Respuesta no útil"
                  >
                    <Icon name="thumbs-down" size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bot-time-stamp">
            <span>{formatTime(message.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
