import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Chat from "@/pages/Chat";

describe("Chat", () => {
  it("renderiza el asistente y el compositor de mensajes", () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Chat />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    );
    expect(screen.getByRole("log", { name: /Conversación/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensaje para el asistente/i)).toBeInTheDocument();
  });
});
