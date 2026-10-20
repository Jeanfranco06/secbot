import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import ChatWidget from "./components/ChatWidget";
import Dashboard from "./components/Dashboard";
import AdminUsers from "./components/AdminUsers";
import AuditLog from "./components/AuditLog";
import api from "./api";

function Layout({ children, onLogout }) {
    return (
        <div>
            <nav style={{ padding: 12, borderBottom: "1px solid #ddd", display: "flex", gap: 16 }}>
                <Link to="/chat">Chat</Link>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/admin/users">Usuarios</Link>
                <Link to="/admin/audit">Auditoría</Link>
                <span style={{ flex: 1 }} />
                <button onClick={onLogout}>Salir</button>
            </nav>
            {children}
        </div>
    );
}

export default function App() {
    const [logged, setLogged] = useState(!!localStorage.getItem("access_token"));

    const login = async (email, password) => {
        const { data } = await api.post("/api/v1/auth/login", { email, password });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        setLogged(true);
    };

    const logout = () => {
        api.post("/api/v1/auth/logout").catch(() => { });
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setLogged(false);
    };

    if (!logged) return <Login onLogin={login} />;

    return (
        <BrowserRouter>
            <Layout onLogout={logout}>
                <Routes>
                    <Route path="/" element={<Navigate to="/chat" replace />} />
                    <Route path="/chat" element={<ChatWidget />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/audit" element={<AuditLog />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const submit = async () => {
        try {
            await onLogin(email, password);
        } catch {
            setErr("Credenciales inválidas");
        }
    };
    return (
        <div style={{ maxWidth: 360, margin: "80px auto", padding: 16 }}>
            <h2>SecBot — Iniciar sesión</h2>
            <input placeholder="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 8 }} />
            <input type="password" placeholder="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: 8, marginBottom: 8 }} />
            <button onClick={submit} style={{ width: "100%", padding: 10 }}>Entrar</button>
            {err && <div style={{ color: "red", marginTop: 8 }}>{err}</div>}
        </div>
    );
}