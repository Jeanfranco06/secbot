import { useState, useEffect, useRef } from "react";
import api from "../api";

export default function ChatWidget() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [chatId, setChatId] = useState(null);
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const userMsg = { role: "user", content: input };
        setMessages((m) => [...m, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const { data } = await api.post("/api/v1/chat/messages", {
                message: input,
                chat_id: chatId,
            });
            setChatId(data.chat_id);
            setMessages((m) => [
                ...m,
                {
                    role: "assistant",
                    content: data.answer,
                    citations: data.citations,
                    ticket_id: data.ticket_id,
                },
            ]);
        } catch (e) {
            setMessages((m) => [
                ...m,
                { role: "assistant", content: "Error al contactar al asistente." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
            <h2>Asistente de Seguridad</h2>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 320 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ margin: "8px 0", textAlign: m.role === "user" ? "right" : "left" }}>
                        <div style={{
                            display: "inline-block", padding: "8px 12px", borderRadius: 12,
                            background: m.role === "user" ? "#daf1ff" : "#f4f4f4",
                            maxWidth: "80%", whiteSpace: "pre-wrap",
                        }}>
                            {m.content}
                            {m.ticket_id && (
                                <div style={{ fontSize: 12, color: "#0a5", marginTop: 6 }}>
                                    Ticket: {m.ticket_id}
                                </div>
                            )}
                        </div>
                        {m.citations?.length > 0 && (
                            <ul style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
                                {m.citations.map((c) => (
                                    <li key={c.index}>
                                        [{c.index}] {c.title} v{c.version}
                                        {c.section ? ` — ${c.section}` : ""}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Escribe tu consulta o reporta un incidente..."
                    style={{ flex: 1, padding: 10 }}
                />
                <button onClick={send} disabled={loading}>
                    {loading ? "..." : "Enviar"}
                </button>
            </div>
        </div>
    );
}