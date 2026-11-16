import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/Icon";
import { SecBotLogo } from "@/components/SecBotLogo";
import { ticketsApi } from "@/lib/api";
import "./layout.css";

export default function Layout() {
  const { user, logout, has } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const toast = useToast();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const items = [
    { to: "/chat", label: t("nav.chat"), icon: "bot", show: true },
    { to: "/dashboard", label: t("nav.dashboard"), icon: "chart", show: has("dashboard.view") },
    { to: "/tickets", label: t("nav.tickets"), icon: "ticket", show: has("ticket.view_all") },
    { to: "/kb", label: t("nav.kb"), icon: "database", show: has("kb.manage") },
    { to: "/reports", label: t("nav.reports"), icon: "file-text", show: has("report.export") },
    { to: "/audit", label: t("nav.audit"), icon: "shield", show: has("audit.view") },
    { to: "/compliance", label: t("nav.compliance"), icon: "shield-check", show: has("audit.view") },
    { to: "/admin/users", label: t("nav.users"), icon: "users", show: has("users.manage") },
    { to: "/admin/roles", label: t("nav.roles"), icon: "key", show: has("users.manage") },
  ].filter((x) => x.show);

  const fetchAlerts = useCallback(async () => {
    if (!user || !has("ticket.view_all")) return;
    try {
      const res = await ticketsApi.alerts();
      setActiveAlerts(res || []);
    } catch {
      // ignore network errors in polling
    }
  }, [user, has]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 25000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleClaimAlert = async (ticketId) => {
    try {
      await ticketsApi.claim(ticketId);
      toast.success("¡Incidente P1 asignado a tu guardia exitosamente!");
      fetchAlerts();
      nav(`/tickets/${ticketId}`);
    } catch (e) {
      toast.error(e.message || "Error al auto-asignarse el incidente");
    }
  };

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

  const topAlert = activeAlerts.find((a) => !dismissedAlerts.has(a.id));

  return (
    <div className="app-shell">
      <header className="app-header glass-panel">
        <div className="app-brand">
          <Link to="/chat" className="app-brand-link" aria-label="Inicio SecBot">
            <SecBotLogo size={36} subtitle={t("nav.tag") || "AI Security"} />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav id="app-nav" className={`app-nav ${menuOpen ? "open" : ""}`} aria-label="Principal">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `app-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={it.icon} size={16} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Action Bar */}
        <div className="app-actions">
          {/* Theme Toggle Button */}
          <button
            className="icon-action-btn"
            onClick={toggleTheme}
            title={isDark ? t("theme.toLight") : t("theme.toDark")}
            aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
          >
            <Icon name={isDark ? "sun" : "moon"} size={17} />
          </button>

          {/* Language Switch Button */}
          <button
            className="lang-pill-btn"
            onClick={toggleLang}
            title={t("lang.switch")}
            aria-label={t("lang.switch")}
          >
            <Icon name="globe" size={14} />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* User Profile / Menu */}
          {user && (
            <div className="app-user-section">
              <Link to="/profile" className="user-profile-badge" title="Ver mi perfil">
                <div className="user-avatar" aria-hidden="true">
                  {getInitials(user.full_name)}
                </div>
                <div className="user-info-text">
                  <span className="user-display-name">{user.full_name || user.email}</span>
                  <span className="user-role-pill">
                    {user.roles?.[0] || "Usuario"}
                  </span>
                </div>
              </Link>

              <button
                className="icon-action-btn btn-logout"
                onClick={onLogout}
                title={t("nav.logout")}
                aria-label={t("nav.logout")}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            className="app-menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="app-nav"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
          >
            <Icon name={menuOpen ? "x" : "menu"} size={20} />
          </button>
        </div>
      </header>

      {/* Banner Pulsante de Alerta Crítica SOC P1 */}
      {topAlert && (
        <aside className="soc-critical-banner animate-fade-in" role="alert">
          <div className="soc-alert-left">
            <span className="soc-alert-pulse-dot" />
            <span className="soc-alert-badge">EMERGENCIA SOC P1</span>
            <span className="soc-alert-title">
              #{topAlert.id.slice(0, 8)}: {topAlert.title}
            </span>
            <span className="soc-alert-status">
              {topAlert.is_unassigned ? "⚠️ SIN ANALISTA ASIGNADO" : `👤 Asignado: ${topAlert.assigned_to_name || "En atención"}`}
            </span>
          </div>

          <div className="soc-alert-right">
            {topAlert.is_unassigned && (
              <button
                type="button"
                className="soc-btn-claim"
                onClick={() => handleClaimAlert(topAlert.id)}
              >
                <Icon name="check" size={13} />
                <span>Asignarme e Investigar</span>
              </button>
            )}
            <button
              type="button"
              className="soc-btn-view"
              onClick={() => nav(`/tickets/${topAlert.id}`)}
            >
              <Icon name="arrow-right" size={13} />
              <span>Ver Incidente</span>
            </button>
            <button
              type="button"
              className="soc-btn-dismiss"
              onClick={() => setDismissedAlerts((prev) => new Set([...prev, topAlert.id]))}
              title="Ocultar banner temporalmente"
              aria-label="Ocultar alerta"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </aside>
      )}

      {/* Backdrop for mobile drawer */}
      {menuOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Routed Area */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
