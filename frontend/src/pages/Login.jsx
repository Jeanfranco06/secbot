import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authApi } from "@/lib/api";
import { Button, Input } from "@/ui";
import "./login.css";

export default function Login() {
  const { login, user } = useAuth();
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
      import("@/lib/api").then(({ saveTokens }) => saveTokens(access, refresh));
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success("Sesión iniciada correctamente");
      nav(loc.state?.from?.pathname || "/chat", { replace: true });
    } catch (err) {
      setError(err.message || "Credenciales inválidas");
    } finally {
      setBusy(false);
    }
  };

  const enabled = Object.entries(providers).filter(([, v]) => v);
  const apiBase = import.meta.env.VITE_API_URL || "";

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit} aria-label="Inicio de sesión">
        <div className="login-brand">
          <div className="login-brand-icon">🛡️</div>
        </div>
        <h1>SecBot Enterprise</h1>
        <p className="login-sub">Asistente Inteligente de Seguridad y Cumplimiento</p>

        <Input
          label="Correo Corporativo"
          placeholder="usuario@empresa.com"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Contraseña"
          placeholder="••••••••••••"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={error}
        />

        <Button type="submit" loading={busy} size="lg" variant="primary">
          Ingresar al Portal
        </Button>

        {enabled.length > 0 && (
          <>
            <div className="login-divider"><span>o continuar con</span></div>
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
          Protegido con autenticación criptográfica RSA-256 y control de acceso RBAC.
        </div>
      </form>
    </div>
  );
}