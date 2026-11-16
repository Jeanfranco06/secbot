import { useEffect, useState, useMemo } from "react";
import { chatApi } from "@/lib/api";
import { Spinner } from "@/ui";
import { Icon } from "@/components/Icon";

export default function ChatHistoryList({ onSelect, activeId, refreshTrigger }) {
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    chatApi.history().then(setItems).catch(() => setItems([]));
  }, [refreshTrigger]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    return items.filter((c) =>
      c.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  // Group by date: Hoy, Esta semana, Anteriores
  const grouped = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { today: [], yesterday: [], older: [] };

    filtered.forEach((c) => {
      const d = new Date(c.started_at);
      if (d >= today) {
        groups.today.push(c);
      } else if (d >= yesterday) {
        groups.yesterday.push(c);
      } else {
        groups.older.push(c);
      }
    });

    return groups;
  }, [filtered]);

  if (items === null) {
    return (
      <div style={{ padding: "30px 0", textAlign: "center", color: "var(--c-text-muted)" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="history-container">
      {/* Search filter in history */}
      {items.length > 3 && (
        <div className="history-search-wrap">
          <Icon name="search" size={13} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Buscar en el historial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="history-search-clear" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="history-empty">
          <Icon name="clock" size={24} />
          <p>{search ? "No se encontraron consultas" : "Sin historial previo"}</p>
        </div>
      ) : (
        <div className="history-groups">
          {grouped.today.length > 0 && (
            <div className="history-group">
              <span className="history-group-title">Hoy</span>
              <ul className="chat-history">
                {grouped.today.map((c) => (
                  <HistoryItem
                    key={c.id}
                    item={c}
                    isActive={c.id === activeId}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </div>
          )}

          {grouped.yesterday.length > 0 && (
            <div className="history-group">
              <span className="history-group-title">Ayer</span>
              <ul className="chat-history">
                {grouped.yesterday.map((c) => (
                  <HistoryItem
                    key={c.id}
                    item={c}
                    isActive={c.id === activeId}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </div>
          )}

          {grouped.older.length > 0 && (
            <div className="history-group">
              <span className="history-group-title">Anteriores</span>
              <ul className="chat-history">
                {grouped.older.map((c) => (
                  <HistoryItem
                    key={c.id}
                    item={c}
                    isActive={c.id === activeId}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryItem({ item, isActive, onSelect }) {
  const getIcon = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("phishing") || t.includes("correo") || t.includes("sospech")) return "shield-alert";
    if (t.includes("contraseñ") || t.includes("password") || t.includes("credencial")) return "key";
    if (t.includes("usb") || t.includes("dispositiv") || t.includes("portátil")) return "lock";
    return "file-text";
  };

  return (
    <li>
      <button
        className={`chat-history-item ${isActive ? "active" : ""}`}
        onClick={() => onSelect(item.id)}
        title={item.title || "Consulta"}
      >
        <div className="item-icon-wrap">
          <Icon name={getIcon(item.title)} size={13} />
        </div>
        <div className="item-text-wrap">
          <span className="chat-history-title">{item.title || "Consulta de seguridad"}</span>
          <span className="chat-history-date">
            {new Date(item.started_at).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </button>
    </li>
  );
}
