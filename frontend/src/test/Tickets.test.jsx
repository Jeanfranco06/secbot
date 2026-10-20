import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Tickets from "@/pages/Tickets";

describe("Tickets", () => {
  it("muestra spinner de carga inicialmente", () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Tickets />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
