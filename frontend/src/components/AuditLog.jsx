import { useEffect, useState } from "react";
import api from "../api";

export default function AuditLog() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({ module: "", action: "", limit: 50, offset: 0 });

    const load = async () => {
        const params = new URLSearchParams();
        if (filter.module) params.append("module", filter.module);
        if (filter.action) params.append("action", filter.action);
        params.append("limit", filter.limit);
        params.append("offset", filter.offset);
        const { data } = await api.get(`/api/v1/admin/audit?${params}`);
        setItems(data.items);
        setTotal(data.total);
    };

    useEffect(() => { load(); }, [filter]);

    return (
        <div style={{ padding: 24 }}>
            <h2>Auditoría ({total})</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input placeholder="módulo" value={filter.module}
                    onChange={(e) => setFilter({ ...filter, module: e.target.value })} />
                <input placeholder="acción" value={filter.action}
                    onChange={(e) => setFilter({ ...filter, action: e.target.value })} />
                <button onClick={() => setFilter({ ...filter, offset: Math.max(0, filter.offset - filter.limit) })}>
                    Anterior
                </button>
                <button onClick={() => setFilter({ ...filter, offset: filter.offset + filter.limit })}>
                    Siguiente
                </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                    <tr>
                        <th align="left">Fecha</th><th align="left">Usuario</th>
                        <th align="left">Módulo</th><th align="left">Acción</th>
                        <th align="left">Entidad</th><th align="left">Resultado</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((r) => (
                        <tr key={r.id}>
                            <td>{new Date(r.created_at).toLocaleString()}</td>
                            <td>{r.user_id || "—"}</td>
                            <td>{r.module}</td>
                            <td>{r.action}</td>
                            <td>{r.entity} {r.entity_id ? `#${r.entity_id.slice(0, 8)}` : ""}</td>
                            <td>{r.result}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}