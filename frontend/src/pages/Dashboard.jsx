import { useEffect, useState } from "react";
import { dashboardApi, reportsApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Select, Spinner, Table, SeverityBadge, StatusBadge } from "@/ui";
import "./dashboard.css";

const Kpi = ({ label, value, hint, tone, icon }) => (
  <Card padding="md" className={`kpi-card ${tone ? `tone-${tone}` : "tone-primary"}`}>
    <div className="kpi">
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        {icon && <span className="kpi-icon">{icon}</span>}
      </div>
      <div className={`kpi-value ${tone ? `kpi-${tone}` : ""}`}>{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  </Card>
);

export default function Dashboard() {
  const toast = useToast();
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
      toast.success(`Reporte ${format.toUpperCase()} descargado`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!data) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Panel de Control de Seguridad</h1>
          <p>Métricas operacionales, índice de incidentes y análisis de consultas RAG</p>
        </div>

        <div className="dashboard-actions">
          <Select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Periodo de tiempo"
            style={{ minWidth: 120 }}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </Select>

          <Button variant="secondary" size="sm" onClick={() => exportAs("pdf")} title="Descargar PDF">
            📄 PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportAs("docx")} title="Descargar Word">
            📝 Word
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportAs("xlsx")} title="Descargar Excel">
            📊 Excel
          </Button>
          <Button size="sm" variant="primary" onClick={load} loading={busy}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-4">
        <Kpi
          label="Total Consultas"
          value={data.total_queries}
          hint="Volumen procesado por RAG"
          icon="💬"
        />
        <Kpi
          label="Resueltas sin Escalamiento"
          value={data.resolved_without_escalation}
          tone="success"
          hint="Atendidas directamente"
          icon="✅"
        />
        <Kpi
          label="Incidentes Reportados"
          value={data.incidents_reported}
          tone="danger"
          hint="Tickets de seguridad generados"
          icon="🚨"
        />
        <Kpi
          label="Horas Ahorradas"
          value={`${data.hours_saved}h`}
          tone="success"
          hint="Ahorro estimado en soporte (10m/c)"
          icon="⚡"
        />
      </div>

      <div className="grid grid-3 mt-4">
        <Kpi
          label="Tasa de Escalamiento"
          value={`${data.escalation_rate}%`}
          hint="Proporción hacia analistas"
          icon="📈"
        />
        <Kpi
          label="Latencia p95"
          value={`${data.p95_latency_ms} ms`}
          hint="Tiempo de respuesta del modelo"
          icon="⏱️"
        />
        <Kpi
          label="Cobertura de Citas"
          value={`${data.citation_coverage}%`}
          hint="Respuestas con fuentes verificadas"
          icon="📚"
        />
      </div>

      <div className="grid grid-2 mt-6">
        <Card title="Temas Más Frecuentes">
          <Table
            columns={[
              { key: "topic", title: "Tema Consultado" },
              { key: "n", title: "Volumen", align: "right" },
            ]}
            rows={data.top_topics || []}
            empty="No hay temas registrados en este periodo"
          />
        </Card>

        <Card title="Distribución de Tickets por Estado">
          <Table
            columns={[
              {
                key: "k",
                title: "Estado",
                render: (r) => <StatusBadge status={r.k} />,
              },
              { key: "v", title: "Cantidad", align: "right" },
            ]}
            rows={Object.entries(data.tickets_by_status || {}).map(([k, v]) => ({ k, v }))}
            empty="No hay tickets en este periodo"
          />
        </Card>
      </div>

      <div className="grid grid-2 mt-5">
        <Card title="Tickets por Severidad">
          <Table
            columns={[
              {
                key: "k",
                title: "Severidad",
                render: (r) => <SeverityBadge severity={r.k} />,
              },
              { key: "v", title: "Incidentes", align: "right" },
            ]}
            rows={Object.entries(data.tickets_by_severity || {}).map(([k, v]) => ({ k, v }))}
            empty="No hay registros de severidad"
          />
        </Card>

        <Card title="Categorías de Incidentes">
          <Table
            columns={[
              { key: "k", title: "Categoría" },
              { key: "v", title: "Cantidad", align: "right" },
            ]}
            rows={Object.entries(data.tickets_by_category || {}).map(([k, v]) => ({ k, v }))}
            empty="No hay categorías registradas"
          />
        </Card>
      </div>
    </div>
  );
}