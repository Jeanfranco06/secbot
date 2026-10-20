import { useEffect, useState } from "react";
import api from "../api";

const Card = ({ title, value, hint }) => (
    <div style={{
        border: "1px solid #e0e0e0", borderRadius: 10, padding: 16,
        background: "#fff", flex: "1 1 200px", minWidth: 200,
    }}>
        <div style={{ fontSize: 13, color: "#666" }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{value}</div>
        {hint && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{hint}</div>}
    </div>
);

export default function Dashboard() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/api/v1/dashboard/summary?days=${days}`);
            setData(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [days]);

    const exportReport = async (fmt) => {
        const res = await api.get(
            `/api/v1/reports/export?report=operational&format=${fmt}&days=${days}`,
            { responseType: "blob" }
        );
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte_${days}d.${fmt}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!data) return <div style={{ padding: 24 }}>Cargando…</div>;

    return (
        <div style={{ padding: 24, fontFamily: "system-ui" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Dashboard de Seguridad</h2>
                <div>
                    <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                        <option value={7}>Últimos 7 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={90}>Últimos 90 días</option>
                    </select>
                    <button onClick={() => exportReport("pdf")} style={{ marginLeft: 8 }}>PDF</button>
                    <button onClick={() => exportReport("docx")} style={{ marginLeft: 4 }}>Word</button>
                    <button onClick={() => exportReport("xlsx")} style={{ marginLeft: 4 }}>Excel</button>
                </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
                <Card title="Consultas totales" value={data.total_queries} />
                <Card title="Resueltas sin escalar" value={data.resolved_without_escalation} />
                <Card title="Incidentes reportados" value={data.incidents_reported} />
                <Card title="Tasa de escalamiento" value={`${data.escalation_rate}%`} />
                <Card title="Latencia p95" value={`${data.p95_latency_ms} ms`} />
                <Card title="Cobertura de citas" value={`${data.citation_coverage}%`} />
                <Card title="Horas ahorradas" value={data.hours_saved} hint="10 min por consulta" />
            </div>

            <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 320px" }}>
                    <h3>Temas frecuentes</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr><th align="left">Tema</th><th align="right">Consultas</th></tr></thead>
                        <tbody>
                            {data.top_topics.map((t, i) => (
                                <tr key={i}><td>{t.topic}</td><td align="right">{t.n}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ flex: "1 1 320px" }}>
                    <h3>Tickets por estado</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr><th align="left">Estado</th><th align="right">Cantidad</th></tr></thead>
                        <tbody>
                            {Object.entries(data.tickets_by_status).map(([k, v]) => (
                                <tr key={k}><td>{k}</td><td align="right">{v}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ flex: "1 1 320px" }}>
                    <h3>Tickets por severidad</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr><th align="left">Severidad</th><th align="right">Cantidad</th></tr></thead>
                        <tbody>
                            {Object.entries(data.tickets_by_severity).map(([k, v]) => (
                                <tr key={k}><td>{k}</td><td align="right">{v}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {loading && <div style={{ marginTop: 12, color: "#888" }}>Actualizando…</div>}
        </div>
    );
}