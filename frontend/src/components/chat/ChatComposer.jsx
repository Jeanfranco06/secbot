import { useState, useRef, useEffect } from "react";
import { Button } from "@/ui";

export default function ChatComposer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const ref = useRef(null);

  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.focus();
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="composer-area">
      <div className="composer-box">
        <textarea
          ref={ref}
          value={text}
          onChange={handleInput}
          onKeyDown={onKey}
          placeholder="Escribe tu consulta de seguridad o reporta un incidente..."
          rows={1}
          disabled={disabled}
          className="composer-input"
          aria-label="Mensaje para el asistente"
        />
        <Button
          onClick={send}
          disabled={disabled || !text.trim()}
          size="sm"
          variant="primary"
          title="Enviar mensaje (Enter)"
        >
          Enviar ↵
        </Button>
      </div>
      <div className="composer-meta">
        <span>Presiona <b>Enter ↵</b> para enviar, <b>Shift + Enter</b> para salto de línea</span>
        <span>SecBot RAG AI · Citas normativas verificadas</span>
      </div>
    </div>
  );
}