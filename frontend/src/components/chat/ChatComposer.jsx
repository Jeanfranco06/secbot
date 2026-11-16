import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";

export default function ChatComposer({ onSend, disabled }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const hasSpeech =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggleListening = () => {
    if (!hasSpeech) {
      toast.info(
        "El dictado por voz requiere Google Chrome, Microsoft Edge, Safari u Opera con micrófono habilitado."
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "es-ES";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("Micrófono activado: habla tu consulta de seguridad...");
      };

      recognition.onresult = (event) => {
        let transcriptChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcriptChunk += event.results[i][0].transcript + " ";
          }
        }
        if (transcriptChunk) {
          setText((prev) =>
            prev ? `${prev.trim()} ${transcriptChunk.trim()}` : transcriptChunk.trim()
          );
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(
              textareaRef.current.scrollHeight,
              180
            )}px`;
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Permiso de acceso al micrófono denegado en el navegador.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      toast.error("No se pudo iniciar el servicio de reconocimiento de voz.");
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="composer-container">
      {/* Listening Indicator Banner */}
      {isListening && (
        <div className="composer-listening-banner animate-fade-in" role="status">
          <div className="listening-pulse-dot" />
          <span className="listening-text">
            Escuchando en tiempo real... di tu consulta o reporte de seguridad
          </span>
          <div className="audio-bars">
            <span className="audio-bar b1" />
            <span className="audio-bar b2" />
            <span className="audio-bar b3" />
            <span className="audio-bar b4" />
          </div>
          <button
            type="button"
            className="listening-stop-btn"
            onClick={toggleListening}
            title="Finalizar dictado"
          >
            Terminar
          </button>
        </div>
      )}

      <div className="composer-card">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={onKeyDown}
          placeholder={
            t("chat.promptPlaceholder") ||
            "¿En qué puedo ayudarte hoy con la seguridad de la empresa?"
          }
          rows={1}
          disabled={disabled}
          className="composer-textarea"
          aria-label="Mensaje para el asistente"
        />

        <div className="composer-actions-bar">
          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`composer-mic-btn ${isListening ? "recording" : ""}`}
            title={
              isListening
                ? "Detener grabación de voz"
                : "Dictar reporte o consulta con voz (Español)"
            }
            aria-label={
              isListening ? "Detener grabación de voz" : "Dictar consulta con voz"
            }
          >
            <Icon name={isListening ? "mic-off" : "mic"} size={16} />
          </button>

          {/* Send Message Button */}
          <button
            type="button"
            onClick={send}
            disabled={disabled || !text.trim()}
            className="composer-send-button"
            title="Enviar mensaje (Enter)"
            aria-label="Enviar"
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>

      <div className="composer-footer-info">
        <span className="composer-hint">
          <b>Enter</b> enviar · <b>Shift+Enter</b> nueva línea · 🎙️ <b>Voz</b> activa
        </span>
        <span className="composer-policy-tag">
          <Icon name="shield-check" size={12} />
          <span>Verificación con normativas corporativas vigentes</span>
        </span>
      </div>
    </div>
  );
}
