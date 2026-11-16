import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card, Badge, Spinner } from "@/ui";
import { Icon } from "@/components/Icon";

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Spinner />
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "SB";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="container">
      <div className="mb-5">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "var(--r-md)",
            background: "var(--c-primary-subtle)", color: "var(--c-primary)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Icon name="user" size={20} />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{t("nav.profile")}</h1>
        </div>
        <p style={{ color: "var(--c-text-muted)", marginTop: 6 }}>
          Identidad criptográfica, roles asignados y privilegios efectivos en el entorno SecBot
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card padding="lg" title="Datos de Identidad">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--c-primary) 0%, #1e40af 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
                boxShadow: "var(--sh-md)",
              }}
            >
              {getInitials(user.full_name || user.email)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{user.full_name || "Usuario"}</h3>
              <div style={{ color: "var(--c-text-muted)", fontSize: 13, marginTop: 2 }}>{user.email}</div>
            </div>
          </div>

          <dl className="def-list">
            <dt>Identificador Único</dt>
            <dd style={{ fontFamily: "var(--f-mono)", fontSize: 12 }}>{user.id || "—"}</dd>
            <dt>Jurisdicción</dt>
            <dd><b>{user.jurisdiction || "default"}</b></dd>
            <dt>Roles Asignados</dt>
            <dd>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(user.roles || []).map((r) => (
                  <Badge key={r} tone={r === "admin" ? "danger" : "default"}>
                    {r}
                  </Badge>
                ))}
              </div>
            </dd>
            <dt>Estado de la Cuenta</dt>
            <dd>
              <Badge tone={user.is_active ? "success" : "muted"}>
                {user.is_active ? "Activo & Verificado" : "Inactivo"}
              </Badge>
            </dd>
          </dl>
        </Card>

        <Card padding="lg" title="Privilegios Efectivos (RBAC)">
          <p style={{ color: "var(--c-text-muted)", fontSize: 13, marginBottom: 16 }}>
            Permisos autorizados mediante los tokens JWT firmados con clave RSA-256 asimétrica:
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 320, overflowY: "auto" }}>
            {(user.permissions || []).map((p) => (
              <span
                key={p}
                style={{
                  background: "var(--c-bg-subtle)",
                  border: "1px solid var(--c-border)",
                  padding: "6px 10px",
                  borderRadius: "var(--r-xs)",
                  fontSize: 12,
                  fontFamily: "var(--f-mono)",
                  color: "var(--c-text-secondary)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Icon name="check" size={12} style={{ color: "var(--c-success)" }} />
                <span>{p}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
