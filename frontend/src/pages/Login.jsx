import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { authApi, saveTokens } from "@/lib/api";
import { Button, Input } from "@/ui";
import { Icon } from "@/components/Icon";
import { SecBotLogo } from "@/components/SecBotLogo";
import "./login.css";

export default function Login() {
  const { login, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState({});

  useEffect(() => {
    if (user) nav(loc.state?.from?.pathname || "/chat", { replace: true });
  }, [user, nav, loc]);

  useEffect(() => {
    authApi.ssoProviders().then(setProviders).catch(() => setProviders({}));
    const h = new URLSearchParams(window.location.hash.slice(1));
    const access = h.get("access");
    const refresh = h.get("refresh");
    if (access && refresh) {
      window.history.replaceState(null, "", window.location.pathname);
      saveTokens(access, refresh);
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success(lang === "es" ? "Sesión iniciada correctamente" : "Successfully signed in");
      nav(loc.state?.from?.pathname || "/chat", { replace: true });
    } catch (err) {
      setError(err.message || (lang === "es" ? "Credenciales inválidas" : "Invalid credentials"));
    } finally {
      setBusy(false);
    }
  };

  const enabled = Object.entries(providers).filter(([, v]) => v);
  const apiBase = import.meta.env.VITE_API_URL || "";

  return (
    <div className="login-wrap">
      {/* Top right quick utilities */}
      <div className="login-top-bar">
        <button
          className="login-tool-btn"
          onClick={toggleTheme}
          title={isDark ? t("theme.toLight") : t("theme.toDark")}
          aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
        >
          <Icon name={isDark ? "sun" : "moon"} size={16} />
        </button>
        <button
          className="login-tool-btn lang-btn"
          onClick={toggleLang}
          title={t("lang.switch")}
          aria-label={t("lang.switch")}
        >
          <Icon name="globe" size={15} />
          <span>{lang.toUpperCase()}</span>
        </button>
      </div>

      <form className="login-card glass-panel" onSubmit={submit} aria-label="Inicio de sesión">
        <div className="login-brand">
          <SecBotLogo size={52} showText={false} />
        </div>

        <h1 className="login-title">SecBot Enterprise</h1>
        <p className="login-sub">
          {lang === "es"
            ? "Plataforma Inteligente de Seguridad y Cumplimiento"
            : "Enterprise Cybersecurity & Compliance AI Platform"}
        </p>

        <div className="login-badges-row">
          <span className="sec-pill"><Icon name="lock" size={11} /> RSA-256</span>
          <span className="sec-pill"><Icon name="key" size={11} /> RBAC</span>
          <span className="sec-pill"><Icon name="shield" size={11} /> NIST CSF</span>
        </div>

        <Input
          label={lang === "es" ? "Correo Corporativo" : "Corporate Email"}
          placeholder="admin@empresa.local"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <Input
          label={lang === "es" ? "Contraseña" : "Password"}
          placeholder="••••••••••••"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={error}
        />

        <Button type="submit" loading={busy} size="lg" variant="primary" className="login-submit-btn">
          <Icon name="lock" size={16} />
          <span>{lang === "es" ? "Ingresar al Portal" : "Sign In to Portal"}</span>
        </Button>

        {enabled.length > 0 && (
          <>
            <div className="login-divider">
              <span>{lang === "es" ? "o continuar con" : "or continue with"}</span>
            </div>
            {enabled.map(([name]) => (
              <a
                key={name}
                className="btn btn-secondary btn-md"
                href={`${apiBase}/api/v1/sso/${name}/login`}
              >
                SSO Corporativo ({name})
              </a>
            ))}
          </>
        )}

        <div className="login-footer-hint">
          <Icon name="shield-check" size={13} />
          <span>
            {lang === "es"
              ? "Autenticación segura con JWT RS256 y control de acceso por roles."
              : "Secured with RS256 cryptographic signatures and role-based access."}
          </span>
        </div>
      </form>
    </div>
  );
}
