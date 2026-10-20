import { useState } from "react";
import { reportsApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Select, Spinner } from "@/ui";

export default function Reports() {
  const toast = useToast();
  const [report, setReport] = useState("operational");
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);

  const download = async (format) => {
    setBusy(true);
    try {
      const blob = await reportsApi.export(report, format, days);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${report}_${days}d.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Reporte ${format.toUpperCase()} generado y descargado`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="mb-5">
        <h1>Centro de Reportes & Exportación</h1>
        <p className="text-muted text-sm mt-1">
          Genera y descarga informes formales de gestión para auditoría, comités de dirección y cumplimiento
        </p>
      </div>

      <div className="grid grid-2" style={{ maxWidth: 960 }}>
        <Card padding="lg" title="Configurar Reporte">
          <Select label="Tipo de Informe" value={report} onChange={(e) => setReport(e.target.value)}>
            <option value="operational">Informe Operacional (Métricas, Tickets, KPIs de SLA)</option>
            <option value="management">Informe de Gestión Ejecutiva (C-Level & Resumen)</option>
          </Select>

          <Select
            label="Ventana Temporal"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Último Trimestre (90 días)</option>
            <option value={180}>Último Semestre (180 días)</option>
          </Select>

          <div style={{ marginTop: 20 }}>
            <div className="field-label mb-2">Formato de Exportación</div>
            <div className="row">
              <Button
                variant="primary"
                onClick={() => download("pdf")}
                disabled={busy}
                title="Descargar documento PDF"
              >
                📄 Descargar PDF
              </Button>
              <Button
                variant="secondary"
                onClick={() => download("docx")}
                disabled={busy}
                title="Descargar documento Word"
              >
                📝 Descargar Word
              </Button>
              <Button
                variant="secondary"
                onClick={() => download("xlsx")}
                disabled={busy}
                title="Descargar hoja Excel"
              >
                📊 Descargar Excel
              </Button>
            </div>
          </div>

          {busy && (
            <div className="row mt-4" style={{ color: "var(--c-primary)" }}>
              <Spinner />
              <span className="text-sm">Generando informe con reportlab / openpyxl...</span>
            </div>
          )}
        </Card>

        <Card padding="lg" title="Información del Formato">
          <div className="col text-sm text-secondary">
            <div>
              <b>📄 Formato PDF:</b> Diseñado con maquetación ejecutiva, gráficos y tablas formateadas, apto para distribución formal.
            </div>
            <div>
              <b>📝 Formato Word (.docx):</b> Editable para incluir comentarios adicionales del CISO o análisis cualitativos de la gerencia.
            </div>
            <div>
              <b>📊 Formato Excel (.xlsx):</b> Datos estructurados con series temporales para análisis detallado y auditorías externas.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}