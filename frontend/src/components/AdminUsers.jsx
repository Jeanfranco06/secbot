import { useEffect, useState } from "react";
import api from "../api";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState({ email: "", full_name: "", password: "", roles: ["employee"] });

    const load = async () => {
        const [u, r] = await Promise.all([
            api.get("/api/v1/admin/users"),
            api.get("/api/v1/admin/roles"),
        ]);
        setUsers(u.data);
        setRoles(r.data);
    };

    useEffect(() => { load(); }, []);

    const create = async () => {
        await api.post("/api/v1/admin/users", form);
        setForm({ email: "", full_name: "", password: "", roles: ["employee"] });
        load();
    };

    const toggleActive = async (u) => {
        await api.patch(`/api/v1/admin/users/${u.id}`, { is_active: !u.is_active });
        load();
    };

    return (
        <div style={{ padding: 24 }}>
            <h2>Usuarios</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input placeholder="Email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input placeholder="Nombre completo" value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                <input placeholder="Password" type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <select value={form.roles[0]}
                    onChange={(e) => setForm({ ...form, roles: [e.target.value] })}>
                    {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <button onClick={create}>Crear</button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th align="left">Email</th><th align="left">Nombre</th>
                        <th align="left">Roles</th><th align="left">Activo</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>{u.email}</td>
                            <td>{u.full_name}</td>
                            <td>{u.roles.join(", ")}</td>
                            <td>{u.is_active ? "Sí" : "No"}</td>
                            <td><button onClick={() => toggleActive(u)}>
                                {u.is_active ? "Desactivar" : "Activar"}
                            </button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}