import { useAuth } from "@/context/AuthContext";
import { Card, Badge, Spinner } from "@/ui";

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
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
        <h1>Perfil de Usuario & Seguridad</h1>
        <p className="text-muted text-sm mt-1">
          Identidad criptográfica, roles asignados y privilegios efectivos en el entorno SecBot
        </p>
      </div>

      <div className="grid grid-2" style={{ maxWidth: 960 }}>
        <Card padding="lg" title="Datos de Identidad">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--c-primary) 0%, #1e40af 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                boxShadow: "var(--sh-md)",
              }}
            >
              {getInitials(user.full_name || user.email)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{user.full_name || "Usuario"}</h3>
              <div className="text-muted text-sm">{user.email}</div>
            </div>
          </div>

          <dl className="def-list">
            <dt>Identificador Único</dt>
            <dd className="text-mono text-xs">{user.id || "—"}</dd>
            <dt>Jurisdicción</dt>
            <dd><b>{user.jurisdiction || "default"}</b></dd>
            <dt>Roles Asignados</dt>
            <dd>
              <div className="row" style={{ gap: 4 }}>
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
          <p className="text-muted text-sm mb-3">
            Permisos autorizados mediante los tokens JWT firmados con clave RSA asimétrica:
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 300, overflowY: "auto" }}>
            {(user.permissions || []).map((p) => (
              <span
                key={p}
                style={{
                  background: "var(--c-bg-subtle)",
                  border: "1px solid var(--c-border)",
                  padding: "4px 8px",
                  borderRadius: "var(--r-xs)",
                  fontSize: 12,
                  fontFamily: "var(--f-mono)",
                  color: "var(--c-text-secondary)",
                }}
              >
                ✓ {p}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}