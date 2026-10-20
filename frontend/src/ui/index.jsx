/**
 * Primitivas UI accesibles y sin dependencias externas.
 * Cada componente tiene estilos mínimos en línea con tokens CSS.
 */
import { forwardRef, useId, useState, useEffect, useRef } from "react";
import "./ui.css";

// ---------- Button ----------
export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

// ---------- Input ----------
export const Input = forwardRef(function Input({ label, error, hint, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id || auto;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="field">
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className={`input ${error ? "input-error" : ""}`}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && !error && <div id={`${inputId}-hint`} className="field-hint">{hint}</div>}
      {error && <div id={`${inputId}-err`} className="field-error" role="alert">{error}</div>}
    </div>
  );
});

// ---------- Select ----------
export const Select = forwardRef(function Select({ label, error, children, id, ...rest }, ref) {
  const auto = useId();
  const sid = id || auto;
  return (
    <div className="field">
      {label && <label htmlFor={sid} className="field-label">{label}</label>}
      <select ref={ref} id={sid} className={`input ${error ? "input-error" : ""}`} {...rest}>
        {children}
      </select>
      {error && <div className="field-error" role="alert">{error}</div>}
    </div>
  );
});

// ---------- Textarea ----------
export const Textarea = forwardRef(function Textarea({ label, error, id, ...rest }, ref) {
  const auto = useId();
  const tid = id || auto;
  return (
    <div className="field">
      {label && <label htmlFor={tid} className="field-label">{label}</label>}
      <textarea ref={ref} id={tid} className={`input ${error ? "input-error" : ""}`} {...rest} />
      {error && <div className="field-error" role="alert">{error}</div>}
    </div>
  );
});

// ---------- Card ----------
export function Card({ title, actions, children, padding = "md" }) {
  return (
    <section className={`card card-${padding}`}>
      {(title || actions) && (
        <header className="card-head">
          <h3 className="card-title">{title}</h3>
          <div className="card-actions">{actions}</div>
        </header>
      )}
      {children}
    </section>
  );
}

// ---------- Badge ----------
export function Badge({ tone = "default", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function SeverityBadge({ severity }) {
  const tone = { P1: "danger", P2: "warning", P3: "info", P4: "muted" }[severity] || "muted";
  return <Badge tone={tone}>{severity}</Badge>;
}

export function StatusBadge({ status }) {
  const map = {
    nuevo: "info", en_progreso: "warning", resuelto: "success",
    cerrado: "muted", cancelado: "muted",
  };
  return <Badge tone={map[status] || "muted"}>{status}</Badge>;
}

// ---------- Table ----------
export function Table({ columns, rows, empty = "Sin datos", rowKey = (r, i) => i, onRowClick }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={{ textAlign: c.align || "left" }}>{c.title}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="table-empty">{empty}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={rowKey(r, i)} onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={onRowClick ? "table-row-click" : ""}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align || "left" }}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Modal ----------
export function Modal({ open, title, onClose, children, footer, size = "md" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal modal-${size}`}
        role="dialog" aria-modal="true" aria-label={title}
        onClick={(e) => e.stopPropagation()}
        ref={ref} tabIndex={-1}
      >
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

// ---------- Spinner ----------
export function Spinner({ label = "Cargando" }) {
  return (
    <div className="spinner" role="status" aria-label={label}>
      <span className="spinner-dot" /><span className="spinner-dot" /><span className="spinner-dot" />
    </div>
  );
}

// ---------- EmptyState ----------
export function EmptyState({ title, description, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

// ---------- Tabs ----------
export function Tabs({ items, value, onChange }) {
  return (
    <div role="tablist" className="tabs">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          className={`tab ${value === it.value ? "tab-active" : ""}`}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}