import { useState } from "react";
import { Button } from "@/ui";

export default function ChatWidget({ apiUrl }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <iframe
          src={`${apiUrl}/chat`}
          title="SecBot"
          style={{
            position: "fixed", bottom: 90, right: 20,
            width: 380, height: 560, border: 0, borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)", zIndex: 9998,
            background: "#fff",
          }}
        />
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        style={{
          position: "fixed", bottom: 20, right: 20, width: 56, height: 56,
          borderRadius: "50%", border: 0, cursor: "pointer",
          background: "#1f4e79", color: "white", fontSize: 24, zIndex: 9999,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        {open ? "×" : "🛡️"}
      </button>
    </>
  );
}