import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Spinner, Badge } from "@/ui";

export default function AdminRoles() {
  const toast = useToast();
  const [roles, setRoles] = useState(null);
  const [perms, setPerms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [r, p] = await Promise.all([adminApi.roles(), adminApi.permissions()]);
      setRoles(r);
      setPerms(p);
      if (r.length && !selected) {
        setSelected(r[0].id);
        setDraft(r[0].permissions || []);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (role) => {
    setSelected(role.id);
    setDraft(role.permissions || []);
  };

  const toggle = (code) => {
    setDraft((d) => (d.includes(code) ? d.filter((x) => x !== code) : [...d, code]));
  };

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.setRolePermissions(selected, draft);
      toast.success("Permisos del rol actualizados exitosamente");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!roles) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner />
      </div>
    );
  }

  const selectedRole = roles.find((r) => r.id === selected);

  return (
    <div className="container">
      <div className="mb-5">
        <h1>Matriz de Roles & Permisos (RBAC)</h1>
        <p className="text-muted text-sm mt-1">
          Configuración granular de capacidades y privilegios para cada perfil de la organización
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "260px 1fr", gap: 20 }}>
        <Card title="Roles de Seguridad" padding="md">
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {roles.map((r) => (
              <li key={r.id}>
                <button
                  className={`chat-history-item ${selected === r.id ? "active" : ""}`}
                  onClick={() => pick(r)}
                  style={{ width: "100%", justifyContent: "space-between", display: "flex", flexDirection: "row", alignItems: "center" }}
                >
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  <Badge tone={r.name === "admin" ? "danger" : "default"}>
                    {r.permissions?.length || 0}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={
            selectedRole
              ? `Permisos de: ${selectedRole.name}`
              : "Selecciona un Rol"
          }
          padding="lg"
          actions={
            <Button size="sm" variant="primary" onClick={save} loading={busy}>
              Guardar Cambios
            </Button>
          }
        >
          <p className="text-muted text-sm mb-4">
            Marca o desmarca los privilegios asignados al rol <b>{selectedRole?.name}</b>:
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {perms.map((p) => {
              const active = draft.includes(p.code);
              return (
                <div
                  key={p.code}
                  onClick={() => toggle(p.code)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--r-sm)",
                    border: `1px solid ${active ? "var(--c-primary-border)" : "var(--c-border)"}`,
                    background: active ? "var(--c-primary-subtle)" : "var(--c-surface)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "all var(--t-fast)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => {}} // controlado por onClick del contenedor
                    style={{ cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: active ? "var(--c-primary)" : "var(--c-text)" }}>
                      {p.code}
                    </div>
                    {p.description && (
                      <div className="text-xs text-muted mt-1">{p.description}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}