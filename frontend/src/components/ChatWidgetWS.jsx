import { useEffect, useRef, useState } from "react";

export default function ChatWidgetWS() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [chatId, setChatId] = useState(null);
    const wsRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const url = (import.meta.env.VITE_WS_URL || "ws://localhost:8000") + `/api/v1/chat/ws?token=${token}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.type === "chat_id") { setChatId(msg.chat_id); return; }
            if (msg.type === "token") {
                setMessages((m) => {
                    const last = m[m.length - 1];
                    if (last?.role === "assistant" && last.streaming) {
                        return [...m.slice(0, -1), { ...last, content: last.content + msg.text }];
                    }
                    return [...m, { role: "assistant", content: msg.text, streaming: true, citations: [] }];
                });
            }
            if (msg.type === "citation") {
                setMessages((m) => {
                    const last = m[m.length - 1];
                    return [...m.slice(0, -1), { ...last, citations: [...(last.citations || []), msg.citation] }];
                });
            }
            if (msg.type === "ticket") {
                setMessages((m) => {
                    const last = m[m.length - 1];
                    return [...m.slice(0, -1), { ...last, ticket_id: msg.ticket_id, ticket_number: msg.ticket_number }];
                });
            }
            if (msg.type === "done") {
                setMessages((m) => {
                    const last = m[m.length - 1];
                    return [...m.slice(0, -1), { ...last, streaming: false }];
                });
            }
        };

        return () => ws.close();
    }, []);

    const send = () => {
        if (!input.trim() || wsRef.current?.readyState !== 1) return;
        setMessages((m) => [...m, { role: "user", content: input }]);
        wsRef.current.send(JSON.stringify({ message: input, chat_id: chatId }));
        setInput("");
    };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
            <h2>Asistente de Seguridad (streaming)</h2>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minHeight: 320 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ margin: "8px 0", textAlign: m.role === "user" ? "right" : "left" }}>
                        <div style={{
                            display: "inline-block", padding: "8px 12px", borderRadius: 12,
                            background: m.role === "user" ? "#daf1ff" : "#f4f4f4",
                            maxWidth: "80%", whiteSpace: "pre-wrap",
                        }}>
                            {m.content}
                            {m.ticket_number && (
                                <div style={{ fontSize: 12, color: "#0a5", marginTop: 6 }}>
                                    Ticket: {m.ticket_number}
                                </div>
                            )}
                        </div>
                        {m.citations?.length > 0 && (
                            <ul style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
                                {m.citations.map((c) => (
                                    <li key={c.index}>[{c.index}] {c.title} v{c.version}{c.section ? ` — ${c.section}` : ""}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Escribe tu consulta..." style={{ flex: 1, padding: 10 }} />
                <button onClick={send}>Enviar</button>
            </div>
        </div>
    );
}