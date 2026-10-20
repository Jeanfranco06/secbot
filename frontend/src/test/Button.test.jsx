import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/ui";

describe("Button", () => {
  it("renderiza y llama onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Pulsa</Button>);
    fireEvent.click(screen.getByText("Pulsa"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("deshabilitado cuando loading", () => {
    render(<Button loading>Espera</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });
});