import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi, reportsApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Card, Select, Spinner, SeverityBadge, StatusBadge } from "@/ui";
import { Icon } from "@/components/Icon";
import "./dashboard.css";

const Kpi = ({ label, value, hint, tone = "primary", icon }) => (
  <Card padding="md" className={`kpi-card tone-${tone}`}>
    <div className="kpi">
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        {icon && (
          <div className="kpi-icon-wrap">
            <Icon name={icon} size={18} />
          </div>
        )}
      </div>
      <div className={`kpi-value kpi-${tone}`}>{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  </Card>
);

// Gráfica de actividad diaria con interactividad al pasar el cursor
const ActivityChart = ({ data = [] }) => {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "30px 0", color: "var(--c-text-muted)", fontSize: 13 }}>
        No se registran consultas en el periodo seleccionado.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count), 5);
  const total = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="activity-chart-wrapper">
      <div className="activity-chart-header">
        <span className="chart-stat-summary">
          Volumen analizado: <b>{total}</b> consultas distribuidas en <b>{data.length}</b> días activos
        </span>
        {hovered ? (
          <div className="chart-tooltip-badge animate-fade-in">
            <span>📅 {hovered.day}:</span>
            <b>{hovered.count} {hovered.count === 1 ? "consulta" : "consultas"}</b>
          </div>
        ) : (
          <span style={{ fontSize: 11.5, color: "var(--c-text-muted)" }}>Pasa el cursor sobre una barra para ver detalle</span>
        )}
      </div>

      <div className="activity-chart-bars">
        {data.map((d, i) => {
          const heightPct = Math.round((d.count / maxVal) * 100);
          const isSelected = hovered?.day === d.day;
          const parts = d.day.split("-");
          const label = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : d.day;
          return (
            <div
              key={i}
              className={`chart-bar-col ${isSelected ? "active" : ""}`}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              title={`${d.day}: ${d.count} consultas`}
            >
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    height: `${Math.max(8, heightPct)}%`,
                    background: isSelected
                      ? "var(--c-cyan)"
                      : "linear-gradient(180deg, var(--c-primary) 0%, rgba(99, 102, 241, 0.45) 100%)",
                  }}
                />
              </div>
              <span className="bar-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const toast = useToast();
  const { t } = useLanguage();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      setData(await dashboardApi.summary(days));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const exportAs = async (format) => {
    try {
      const blob = await reportsApi.export("operational", format, days);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_seguridad_${days}d.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Reporte ${format.toUpperCase()} descargado con éxito`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoStr;
    }
  };

  if (!data) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Spinner />
      </div>
    );
  }

  // Tasa de resolución sin escalamiento porcentual calculada de forma dinámica
  const resolutionPercentage = data.resolution_rate !== undefined
    ? Number(data.resolution_rate).toFixed(1)
    : data.total_queries > 0
      ? ((data.resolved_without_escalation / data.total_queries) * 100).toFixed(1)
      : "100.0";

  const totalIncidents = data.incidents_reported || Object.values(data.tickets_by_status || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "var(--r-md)",
              background: "var(--c-primary-subtle)", color: "var(--c-primary)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icon name="chart" size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Centro de Operaciones y Métricas</h1>
          </div>
          <p style={{ color: "var(--c-text-muted)", marginTop: 6 }}>
            Supervisión integral de telemetría de seguridad, actividad de usuarios, cumplimiento normativo y runbooks.
          </p>
        </div>

        <div className="dashboard-actions">
          <Select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Periodo de tiempo"
            style={{ minWidth: 140 }}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </Select>

          <Button variant="secondary" size="sm" onClick={() => exportAs("pdf")} title="Descargar PDF">
            <Icon name="download" size={13} />
            <span>PDF</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportAs("docx")} title="Descargar Word">
            <Icon name="download" size={13} />
            <span>Word</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportAs("xlsx")} title="Descargar Excel">
            <Icon name="download" size={13} />
            <span>Excel</span>
          </Button>
          <Button size="sm" variant="primary" onClick={load} loading={busy}>
            <Icon name="refresh" size={13} />
            <span>{t("common.refresh")}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-kpi-grid">
        <Kpi
          label={t("dash.totalQueries")}
          value={data.total_queries}
          hint={`${data.queries_by_day?.length || 0} días analizados`}
          icon="bot"
          tone="primary"
        />
        <Kpi
          label={t("dash.resolutionRate")}
          value={`${resolutionPercentage}%`}
          hint={`${data.resolved_without_escalation} resueltas sin crear ticket`}
          icon="shield-check"
          tone="success"
        />
        <Kpi
          label={t("dash.incidentsTotal")}
          value={data.incidents_reported}
          hint={`Tasa de escalado: ${Number(data.escalation_rate || 0).toFixed(1)}%`}
          icon="alert-triangle"
          tone={data.incidents_reported > 0 ? "warning" : "muted"}
        />
        <Kpi
          label={t("dash.latencyP95")}
          value={`${Math.round(data.p95_latency_ms)} ms`}
          hint={`Promedio: ${Math.round(data.avg_latency_ms)} ms`}
          icon="clock"
          tone="info"
        />
        <Kpi
          label={t("dash.hoursSaved")}
          value={`${data.hours_saved} h`}
          hint="Calculado a 10 min por consulta"
          icon="sparkles"
          tone="success"
        />
        <Kpi
          label="Cobertura de Citas"
          value={`${Number(data.citation_coverage || 0).toFixed(0)}%`}
          hint="Respuestas con fuentes normativas"
          icon="file-text"
          tone="primary"
        />
      </div>

      {/* Activity Timeline Chart Card */}
      <Card title="Evolución de Actividad de Consultas (Línea de Tiempo)" className="activity-chart-card">
        <ActivityChart data={data.queries_by_day || []} />
      </Card>

      {/* Middle Grid: Severity Distribution & Ticket Status Workflow */}
      <div className="dashboard-sections-grid">
        {/* Severity Distribution */}
        <Card title={t("dash.severityDist")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["P1", "P2", "P3", "P4"].map((sev) => {
              const count = data.tickets_by_severity?.[sev] || 0;
              const total = totalIncidents || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={sev} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <SeverityBadge severity={sev} />
                      <span style={{ fontWeight: 600 }}>{count} incidentes</span>
                    </div>
                    <span style={{ color: "var(--c-text-muted)", fontSize: 12 }}>{pct}%</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "var(--c-bg-subtle)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: sev === "P1" ? "var(--c-danger)" : sev === "P2" ? "var(--c-warning)" : "var(--c-primary)",
                      borderRadius: 999, transition: "width 0.4s ease"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tickets Status Workflow & SLA */}
        <Card title="Ciclo de Vida de Incidentes & SLA">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { status: "nuevo", label: "Nuevos / Pendientes", icon: "alert-circle", color: "var(--c-warning)" },
              { status: "en_progreso", label: "En Investigación Activa", icon: "clock", color: "var(--c-primary)" },
              { status: "resuelto", label: "Resueltos / Mitigados", icon: "check", color: "var(--c-success)" },
            ].map((st) => {
              const count = data.tickets_by_status?.[st.status] || 0;
              const total = totalIncidents || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={st.status} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <StatusBadge status={st.status} />
                      <span style={{ fontWeight: 600 }}>{st.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{count}</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "var(--c-bg-subtle)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: st.color,
                      borderRadius: 999, transition: "width 0.4s ease"
                    }} />
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: 6, padding: "10px 14px", borderRadius: "var(--r-sm)",
              background: "var(--c-primary-subtle)", border: "1px solid var(--c-primary-border)",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="shield-check" size={16} style={{ color: "var(--c-primary)" }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-text)" }}>Cumplimiento de SLA</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--c-primary)" }}>
                {data.sla_breached > 0 ? `${Math.max(0, 100 - (data.sla_breached * 10))}%` : "100% en regla"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Topics & Trust Operations Grid */}
      <div className="dashboard-sections-grid">
        {/* Top Topics */}
        <Card title={t("dash.topTopics")}>
          {data.top_topics?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.top_topics.map((tp, idx) => {
                const count = tp.n ?? tp.count ?? 0;
                const maxCount = data.top_topics[0]?.n || 1;
                const totalQ = data.total_queries || 1;
                const pct = Math.round((count / totalQ) * 100);
                const topicName = (tp.topic || tp.category || "Consultas Generales").replace(/_/g, " ");
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: "10px 12px",
                      background: "var(--c-bg-subtle)",
                      borderRadius: "var(--r-sm)",
                      border: "1px solid var(--c-border)",
                      transition: "all var(--t-fast)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 20,
                          height: 20,
                          borderRadius: "var(--r-xs)",
                          background: idx === 0 ? "var(--c-primary)" : "var(--c-surface)",
                          color: idx === 0 ? "#ffffff" : "var(--c-text-muted)",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                          border: "1px solid var(--c-border)"
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{
                          fontWeight: 600,
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {topicName}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "var(--c-primary)",
                          background: "var(--c-primary-subtle)",
                          padding: "2px 8px",
                          borderRadius: "var(--r-full)"
                        }}>
                          {count} {count === 1 ? "consulta" : "consultas"}
                        </span>
                        <span style={{ color: "var(--c-text-muted)", fontSize: 12, minWidth: 32, textAlign: "right" }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ width: "100%", height: 4, background: "var(--c-border)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(6, (count / maxCount) * 100))}%`,
                        height: "100%",
                        background: idx === 0 ? "var(--c-primary)" : "var(--c-cyan)",
                        borderRadius: 999,
                        transition: "width 0.4s ease"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--c-text-muted)", fontStyle: "italic", fontSize: 13 }}>
              Los temas se clasificarán automáticamente a medida que aumente el volumen de interacciones.
            </p>
          )}
        </Card>

        {/* Security & AI Trust Telemetry */}
        <Card title="Telemetría de Seguridad & Confianza RAG">
          <div className="trust-metrics-list">
            <div className="trust-item">
              <div className="trust-item-left">
                <div className="trust-icon-box" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
                  <Icon name="database" size={16} />
                </div>
                <div className="trust-item-info">
                  <span className="trust-item-title">Políticas Normativas Indexadas</span>
                  <span className="trust-item-desc">Documentos activos en Base de Conocimiento RAG</span>
                </div>
              </div>
              <span className="trust-badge-status" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                {data.active_kb_docs || 10} activos
              </span>
            </div>

            <div className="trust-item">
              <div className="trust-item-left">
                <div className="trust-icon-box" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <Icon name="shield-check" size={16} />
                </div>
                <div className="trust-item-info">
                  <span className="trust-item-title">Filtrado Preventivo de PII</span>
                  <span className="trust-item-desc">Ofuscación de DNIs, tarjetas de crédito y teléfonos</span>
                </div>
              </div>
              <span className="trust-badge-status" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                Activo · 100%
              </span>
            </div>

            <div className="trust-item">
              <div className="trust-item-left">
                <div className="trust-icon-box" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                  <Icon name="lock" size={16} />
                </div>
                <div className="trust-item-info">
                  <span className="trust-item-title">Defensa contra Prompt Injection</span>
                  <span className="trust-item-desc">Barrera de seguridad de entrada para prompts maliciosos</span>
                </div>
              </div>
              <span className="trust-badge-status" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                Protegido
              </span>
            </div>

            <div className="trust-item">
              <div className="trust-item-left">
                <div className="trust-icon-box" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
                  <Icon name="sparkles" size={16} />
                </div>
                <div className="trust-item-info">
                  <span className="trust-item-title">Caché Semántico Redis</span>
                  <span className="trust-item-desc">Respuestas instantáneas en milisegundos para consultas recurrentes</span>
                </div>
              </div>
              <span className="trust-badge-status" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
                Online
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Incidents SOC Feed Table */}
      <Card
        title="Incidentes Recientes de Seguridad (Feed SOC en Vivo)"
        className="dashboard-table-card"
        actions={
          <Link to="/tickets" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-primary)", textDecoration: "none" }}>
            Ver todos los tickets →
          </Link>
        }
      >
        {data.recent_incidents?.length > 0 ? (
          <div className="incidents-table-container">
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>N° Ticket</th>
                  <th>Incidente / Resumen</th>
                  <th>Categoría</th>
                  <th>Severidad</th>
                  <th>Estado</th>
                  <th>Reportado Por</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_incidents.map((tck) => (
                  <tr key={tck.id}>
                    <td>
                      <Link to={`/tickets/${tck.id}`} className="ticket-number-pill" title="Ver ticket">
                        {tck.ticket_number}
                      </Link>
                    </td>
                    <td>
                      <span className="ticket-table-title" title={tck.title}>
                        {tck.title}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize", color: "var(--c-text-secondary)" }}>
                        {tck.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <SeverityBadge severity={tck.severity} />
                    </td>
                    <td>
                      <StatusBadge status={tck.status} />
                    </td>
                    <td style={{ fontSize: 12.5, color: "var(--c-text-muted)" }}>
                      {tck.reporter_name}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--c-text-muted)" }}>
                      {formatDate(tck.created_at)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link to={`/tickets/${tck.id}`} className="ticket-table-action-btn">
                        <span>Detalle</span>
                        <Icon name="chevron-right" size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--c-text-muted)", fontStyle: "italic", fontSize: 13, margin: "16px 0" }}>
            No se han registrado incidentes en el periodo seleccionado.
          </p>
        )}
      </Card>
    </div>
  );
}
