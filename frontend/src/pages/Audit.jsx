import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Input, Modal, Spinner, Table, Badge } from "@/ui";

export default function Audit() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ module: "", action: "", limit: 50, offset: 0 });
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const params = { limit: filter.limit, offset: filter.offset };
      if (filter.module) params.module = filter.module;
      if (filter.action) params.action = filter.action;
      const data = await adminApi.audit(params);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container">
      <div className="row-between mb-4">
        <div>
          <h1>Pista de Auditoría Forense</h1>
          <p className="text-muted text-sm mt-1">
            Registro inmutable de actividades del sistema, autenticación y consultas ({total} eventos indexados)
          </p>
        </div>

        <div className="row">
          <Button
            size="sm"
            variant="secondary"
            disabled={filter.offset === 0}
            onClick={() => setFilter({ ...filter, offset: Math.max(0, filter.offset - filter.limit) })}
          >
            ← Anterior
          </Button>
          <span className="text-xs text-muted">
            Pág. {Math.floor(filter.offset / filter.limit) + 1} de {Math.max(1, Math.ceil(total / filter.limit))}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={filter.offset + filter.limit >= total}
            onClick={() => setFilter({ ...filter, offset: filter.offset + filter.limit })}
          >
            Siguiente →
          </Button>
        </div>
      </div>

      <Card padding="md" className="mb-4">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 12, alignItems: "center" }}>
          <Input
            placeholder="Filtrar por Módulo (auth, chat, admin...)"
            value={filter.module}
            onChange={(e) => setFilter({ ...filter, module: e.target.value, offset: 0 })}
            style={{ marginBottom: 0 }}
          />
          <Input
            placeholder="Filtrar por Acción (login, query, update...)"
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value, offset: 0 })}
            style={{ marginBottom: 0 }}
          />
          <Button size="sm" variant="primary" onClick={load} loading={busy}>
            Filtrar
          </Button>
          {(filter.module || filter.action) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilter({ ...filter, module: "", action: "", offset: 0 })}
            >
              Limpiar
            </Button>
          )}
        </div>
      </Card>

      <Card padding="md">
        <Table
          rowKey={(r) => r.id}
          onRowClick={(r) => setDetail(r)}
          columns={[
            {
              key: "created_at",
              title: "Fecha & Hora",
              render: (r) =>
                new Date(r.created_at).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "medium",
                }),
            },
            {
              key: "module",
              title: "Módulo",
              render: (r) => <span style={{ fontWeight: 600 }}>{r.module}</span>,
            },
            {
              key: "action",
              title: "Acción",
              render: (r) => <Badge tone="info">{r.action}</Badge>,
            },
            {
              key: "user_id",
              title: "Usuario / ID",
              render: (r) => (
                <span className="text-mono text-xs">{r.user_id ? r.user_id.slice(0, 8) + "..." : "Sistema"}</span>
              ),
            },
            {
              key: "ip",
              title: "Dirección IP",
              render: (r) => <span className="text-mono text-xs">{r.ip || "—"}</span>,
            },
            {
              key: "result",
              title: "Resultado",
              render: (r) => (
                <Badge tone={r.result === "ok" ? "success" : "danger"}>
                  {r.result}
                </Badge>
              ),
            },
          ]}
          rows={items}
          empty="No hay eventos de auditoría registrados con los filtros aplicados"
        />
      </Card>

      <Modal
        open={Boolean(detail)}
        title="Detalle del Evento de Auditoría"
        onClose={() => setDetail(null)}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setDetail(null)}>Cerrar</Button>}
      >
        {detail && (
          <div className="col">
            <dl className="def-list">
              <dt>ID Registro</dt>
              <dd className="text-mono">{detail.id}</dd>
              <dt>Timestamp</dt>
              <dd>{new Date(detail.created_at).toLocaleString()}</dd>
              <dt>Módulo / Acción</dt>
              <dd><b>{detail.module}</b> :: {detail.action}</dd>
              <dt>Entidad / ID</dt>
              <dd>{detail.entity || "—"} {detail.entity_id ? `(${detail.entity_id})` : ""}</dd>
              <dt>IP & User Agent</dt>
              <dd>{detail.ip || "—"} — <span className="text-xs text-muted">{detail.user_agent || "—"}</span></dd>
              <dt>Request ID</dt>
              <dd className="text-mono text-xs">{detail.request_id || "—"}</dd>
            </dl>

            <div className="mt-3">
              <h4>Datos de Entrada (Input)</h4>
              <pre className="json-view">{JSON.stringify(detail.input, null, 2) || "null"}</pre>
            </div>

            <div className="mt-3">
              <h4>Datos de Salida (Output)</h4>
              <pre className="json-view">{JSON.stringify(detail.output, null, 2) || "null"}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}