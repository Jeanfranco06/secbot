import { useEffect, useState } from "react";
import { sessionsApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Spinner, Table, Badge } from "@/ui";

export default function Sessions() {
  const toast = useToast();
  const [items, setItems] = useState(null);

  const load = async () => {
    try {
      setItems(await sessionsApi.list());
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (id) => {
    if (!confirm("¿Deseas revocar esta sesión? El dispositivo tendrá que volver a iniciar sesión.")) return;
    try {
      await sessionsApi.revoke(id);
      toast.success("Sesión revocada de forma inmediata");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!items) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mb-5">
        <h1>Sesiones Activas & Tokens de Refresco</h1>
        <p className="text-muted text-sm mt-1">
          Dispositivos y clientes que disponen de un token de refresco válido para renovar credenciales
        </p>
      </div>

      <Card padding="md">
        <Table
          rowKey={(r) => r.id}
          columns={[
            {
              key: "created_at",
              title: "Fecha de Inicio",
              render: (r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(r.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </div>
                  <div className="text-muted text-xs">JTI: {r.refresh_jti?.slice(0, 8)}...</div>
                </div>
              ),
            },
            {
              key: "ip",
              title: "Dirección IP",
              render: (r) => <span className="text-mono text-xs">{r.ip || "127.0.0.1"}</span>,
            },
            {
              key: "user_agent",
              title: "Cliente / Navegador",
              render: (r) => (
                <div className="text-xs text-secondary" style={{ maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.user_agent}>
                  {r.user_agent || "Desconocido"}
                </div>
              ),
            },
            {
              key: "status",
              title: "Estado",
              render: (r) => (
                <Badge tone={r.revoked_at ? "muted" : "success"}>
                  {r.revoked_at ? "Revocada" : "Activa"}
                </Badge>
              ),
            },
            {
              key: "actions",
              title: "Acciones",
              align: "right",
              render: (r) =>
                !r.revoked_at ? (
                  <Button size="xs" variant="danger" onClick={() => revoke(r.id)}>
                    Revocar
                  </Button>
                ) : (
                  <span className="text-muted text-xs">Finalizada</span>
                ),
            },
          ]}
          rows={items}
          empty="No hay sesiones registradas"
        />
      </Card>
    </div>
  );
}