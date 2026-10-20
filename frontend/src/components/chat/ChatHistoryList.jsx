import { useEffect, useState } from "react";
import { chatApi } from "@/lib/api";
import { Spinner, EmptyState } from "@/ui";

export default function ChatHistoryList({ onSelect, activeId }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    chatApi.history().then(setItems).catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState title="Sin conversaciones" description="Tus conversaciones previas aparecerán aquí" />;
  }

  return (
    <ul className="chat-history">
      {items.map((c) => (
        <li key={c.id}>
          <button
            className={`chat-history-item ${c.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(c.id)}
            title={c.title || "Conversación"}
          >
            <div className="chat-history-title">💬 {c.title || "Consulta de seguridad"}</div>
            <div className="chat-history-date">
              {new Date(c.started_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}