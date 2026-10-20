import { useState } from "react";
import { chatApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, SeverityBadge } from "@/ui";

export default function ChatMessage({ message }) {
  const toast = useToast();
  const [rated, setRated] = useState(false);
  const isUser = message.role === "user";

  const rate = async (rating) => {
    try {
      await chatApi.feedback(message.message_id, rating);
      setRated(true);
      toast.success(rating > 3 ? "¡Gracias por valorar positivamente!" : "Gracias por tu feedback");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className={`msg-wrapper ${isUser ? "msg-wrapper-user" : "msg-wrapper-bot"}`}>
      {!isUser && (
        <div className="msg-avatar msg-avatar-bot" title="SecBot AI">
          🛡️
        </div>
      )}

      <div className="msg-bubble">
        <div className="msg-content">
          {message.content}
          {message.streaming && <span className="streaming-cursor" />}
        </div>

        {message.ticket && (
          <div className="msg-ticket">
            <span>🎫 Incidente registrado como ticket <b>{message.ticket.ticket_number}</b></span>
            <SeverityBadge severity={message.ticket.severity} />
          </div>
        )}

        {message.citations?.length > 0 && (
          <ul className="msg-citations">
            {message.citations.map((c, idx) => (
              <li key={c.index || idx} className="cite-item">
                <span className="cite-idx">Doc [{c.index || idx + 1}]</span>
                <span>
                  <b>{c.title}</b> v{c.version}
                  {c.section ? ` — § ${c.section}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!isUser && !message.streaming && message.message_id && !rated && (
          <div className="msg-actions" aria-label="Valorar respuesta">
            <Button size="xs" variant="ghost" onClick={() => rate(5)} title="Respuesta útil">
              👍 Útil
            </Button>
            <Button size="xs" variant="ghost" onClick={() => rate(1)} title="Respuesta no útil">
              👎 No útil
            </Button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="msg-avatar msg-avatar-user" title="Usuario">
          👤
        </div>
      )}
    </div>
  );
}