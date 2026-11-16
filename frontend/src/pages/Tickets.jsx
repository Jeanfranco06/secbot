import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ticketsApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Card, Select, SeverityBadge, Spinner, StatusBadge, Table } from "@/ui";
import { Icon } from "@/components/Icon";

export default function Tickets() {
  const toast = useToast();
  const { t } = useLanguage();
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", severity: "" });

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.severity) params.severity = filters.severity;
      setItems(await ticketsApi.list(params));
    } catch (e) {
      toast.error(e.message);
      setItems([]);
    }
  }, [filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Derived metrics for KPI cards
  const stats = useMemo(() => {
    if (!items) return { total: 0, p1p2: 0, inProgress: 0, resolved: 0 };
    return {
      total: items.length,
      p1p2: items.filter((x) => x.severity === "P1" || x.severity === "P2").length,
      inProgress: items.filter((x) => x.status === "en_progreso" || x.status === "nuevo").length,
      resolved: items.filter((x) => x.status === "resuelto" || x.status === "cerrado").length,
    };
  }, [items]);

  // Filtered by search text
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (x) =>
        x.ticket_number?.toLowerCase().includes(q) ||
        x.title?.toLowerCase().includes(q) ||
        x.category?.toLowerCase().includes(q)
    );
  }, [items, search]);

  if (items === null) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      {/* Page Header */}
      <div className="row-between mb-5" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--r-md)",
              background: "var(--c-primary-subtle)", color: "var(--c-primary)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icon name="ticket" size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{t("tickets.title")}</h1>
          </div>
          <p className="text-muted text-sm mt-1" style={{ color: "var(--c-text-muted)", marginTop: 6 }}>
            {t("tickets.subtitle")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Button size="sm" variant="secondary" onClick={load}>
            <Icon name="refresh" size={14} />
            <span>{t("common.refresh")}</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--c-text-muted)", fontSize: 12, fontWeight: 600 }}>
            <span>TOTAL TICKETS</span>
            <Icon name="ticket" size={16} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: "var(--c-text)" }}>
            {stats.total}
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--c-danger)", fontSize: 12, fontWeight: 600 }}>
            <span>CRÍTICOS (P1 / P2)</span>
            <Icon name="alert-triangle" size={16} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: "var(--c-danger)" }}>
            {stats.p1p2}
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--c-warning)", fontSize: 12, fontWeight: 600 }}>
            <span>PENDIENTES / EN CURSO</span>
            <Icon name="clock" size={16} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: "var(--c-warning)" }}>
            {stats.inProgress}
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--c-success)", fontSize: 12, fontWeight: 600 }}>
            <span>RESUELTOS</span>
            <Icon name="shield-check" size={16} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: "var(--c-success)" }}>
            {stats.resolved}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm" style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "4px 8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
            <Icon name="search" size={16} style={{ color: "var(--c-text-muted)" }} />
            <input
              type="text"
              className="input"
              style={{ border: "none", background: "transparent", padding: "6px 0", boxShadow: "none" }}
              placeholder={t("tickets.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ minWidth: 150 }}
              aria-label="Filtrar por estado"
            >
              <option value="">{t("tickets.statusAll")}</option>
              <option value="nuevo">{t("tickets.statusNuevo")}</option>
              <option value="en_progreso">{t("tickets.statusProgreso")}</option>
              <option value="resuelto">{t("tickets.statusResuelto")}</option>
              <option value="cerrado">{t("tickets.statusCerrado")}</option>
            </Select>

            <Select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              style={{ minWidth: 140 }}
              aria-label="Filtrar por severidad"
            >
              <option value="">{t("tickets.severity")}: {t("common.all")}</option>
              <option value="P1">P1 (Crítico)</option>
              <option value="P2">P2 (Alto)</option>
              <option value="P3">P3 (Medio)</option>
              <option value="P4">P4 (Bajo)</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
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
                  style={{
                    fontWeight: 700,
                    fontFamily: "var(--f-mono)",
                    color: "var(--c-primary)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <Icon name="ticket" size={14} />
                  <span>{r.ticket_number}</span>
                </Link>
              ),
            },
            {
              key: "title",
              title: "Título del Incidente",
              render: (r) => (
                <div style={{ fontWeight: 600, color: "var(--c-text)" }}>{r.title}</div>
              ),
            },
            {
              key: "category",
              title: t("tickets.category"),
              render: (r) => (
                <span style={{
                  textTransform: "capitalize",
                  background: "var(--c-bg-subtle)",
                  padding: "3px 8px",
                  borderRadius: "var(--r-xs)",
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {r.category || "General"}
                </span>
              ),
            },
            {
              key: "severity",
              title: t("tickets.severity"),
              render: (r) => <SeverityBadge severity={r.severity} />,
            },
            {
              key: "status",
              title: t("common.status"),
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "created_at",
              title: t("common.date"),
              render: (r) => (
                <span style={{ color: "var(--c-text-muted)", fontSize: 12 }}>
                  {new Date(r.created_at).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              ),
            },
          ]}
          rows={filteredItems}
          empty={t("tickets.noTickets")}
        />
      </Card>
    </div>
  );
}
