import { createContext, useCallback, useContext, useState, useMemo } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((message, { type = "info", ttl = 4000 } = {}) => {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    setToasts((t) => [...t, { id, message, type }]);
    if (ttl > 0) setTimeout(() => remove(id), ttl);
    return id;
  }, [remove]);

  const value = useMemo(() => ({
    push,
    success: (m, o) => push(m, { ...o, type: "success" }),
    error: (m, o) => push(m, { ...o, type: "error", ttl: 7000 }),
    info: (m, o) => push(m, { ...o, type: "info" }),
    warn: (m, o) => push(m, { ...o, type: "warning" }),
  }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite" aria-label="Notificaciones">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <span>{t.message}</span>
            <button className="icon-btn" onClick={() => remove(t.id)} aria-label="Cerrar">×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast fuera de ToastProvider");
  return ctx;
}