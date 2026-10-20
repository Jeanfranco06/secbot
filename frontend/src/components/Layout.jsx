import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import "./layout.css";

export default function Layout() {
  const { user, logout, has } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = [
    { to: "/chat", label: "Chat Asistente", show: true },
    { to: "/dashboard", label: "Dashboard", show: has("dashboard.view") },
    { to: "/tickets", label: "Incidentes & Tickets", show: has("ticket.view_all") || has("ticket.view_own") },
    { to: "/kb", label: "Base de Conocimiento", show: has("kb.manage") },
    { to: "/reports", label: "Reportes", show: has("report.export") },
    { to: "/audit", label: "Auditoría", show: has("audit.view") },
    { to: "/compliance", label: "Cumplimiento", show: has("audit.view") },
    { to: "/admin/users", label: "Usuarios", show: has("users.manage") },
    { to: "/admin/roles", label: "Roles", show: has("users.manage") },
  ].filter((x) => x.show);

  const onLogout = async () => {
    await logout();
    nav("/login", { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return "SB";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <Link to="/chat" className="app-brand-link" aria-label="Inicio SecBot">
            <span className="brand-icon">🛡️</span>
            <span>SecBot</span>
            <span className="brand-tag">Security AI</span>
          </Link>
        </div>

        <button
          className="app-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="app-nav"
          onClick={() => setMenuOpen((v) => !v)}
          title="Menú"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav id="app-nav" className={`app-nav ${menuOpen ? "open" : ""}`} aria-label="Principal">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `app-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-user">
          <Link to="/sessions" className="btn btn-ghost btn-sm" title="Sesiones activas">
            Sesiones
          </Link>
          <Link to="/profile" className="user-profile-badge" title="Mi perfil">
            <div className="user-avatar">{getInitials(user?.full_name || user?.email)}</div>
            <span className="app-user-name">{user?.full_name || user?.email}</span>
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Cerrar sesión">
            Salir
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}