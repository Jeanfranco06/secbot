import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Login from "@/pages/Login";

describe("Login", () => {
  it("renderiza el formulario de inicio de sesión", () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /SecBot Enterprise/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ingresar al Portal/i })).toBeInTheDocument();
  });
});
