import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ticketsApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Select, SeverityBadge, Spinner, StatusBadge, Table } from "@/ui";

export default function Tickets() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [filters, setFilters] = useState({ status: "", severity: "" });

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;
      setItems(await ticketsApi.list(params));
    } catch (e) {
      toast.error(e.message);
    }
  }, [filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (items === null) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row-between mb-5">
        <div>
          <h1>Gestión de Incidentes & Tickets</h1>
          <p className="text-muted text-sm mt-1">
            Registro de incidentes escalados automáticamente desde el asistente de seguridad
          </p>
        </div>

        <div className="row">
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{ minWidth: 150 }}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_progreso">En progreso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
            <option value="cancelado">Cancelado</option>
          </Select>

          <Select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            style={{ minWidth: 140 }}
            aria-label="Filtrar por severidad"
          >
            <option value="">Severidades</option>
            <option value="P1">P1 (Crítico)</option>
            <option value="P2">P2 (Alto)</option>
            <option value="P3">P3 (Medio)</option>
            <option value="P4">P4 (Bajo)</option>
          </Select>

          <Button size="sm" variant="primary" onClick={load}>
            Refrescar
          </Button>
        </div>
      </div>

      <Card padding="md">
        <Table
          rowKey={(r) => r.id}
          columns={[
            {
              key: "ticket_number",
              title: "Código",
              render: (r) => (
                <Link
                  to={`/tickets/${r.id}`}
                  style={{ fontWeight: 700, fontFamily: "var(--f-mono)", color: "var(--c-primary)" }}
                >
                  {r.ticket_number}
                </Link>
              ),
            },
            {
              key: "title",
              title: "Título del Incidente",
              render: (r) => (
                <div style={{ fontWeight: 600 }}>{r.title}</div>
              ),
            },
            {
              key: "category",
              title: "Categoría",
              render: (r) => <span style={{ textTransform: "capitalize" }}>{r.category || "General"}</span>,
            },
            {
              key: "severity",
              title: "Severidad",
              render: (r) => <SeverityBadge severity={r.severity} />,
            },
            {
              key: "status",
              title: "Estado",
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "created_at",
              title: "Fecha de Creación",
              render: (r) =>
                new Date(r.created_at).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                }),
            },
          ]}
          rows={items}
          empty="No hay tickets que coincidan con los filtros seleccionados"
        />
      </Card>
    </div>
  );
}