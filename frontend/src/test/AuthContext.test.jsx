import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

vi.mock("@/lib/api", () => ({
  authApi: { me: vi.fn().mockResolvedValue({ id: "1", email: "a@b.c", roles: ["admin"], permissions: ["chat.use"] }) },
  getAccessToken: () => "token",
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

function Probe() {
  const { user, loading, has } = useAuth();
  if (loading) return <span>loading</span>;
  return (
    <div>
      <span data-testid="email">{user?.email}</span>
      <span data-testid="perm">{has("chat.use") ? "yes" : "no"}</span>
    </div>
  );
}

describe("AuthContext", () => {
  it("carga usuario con permisos", async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("email")).toHaveTextContent("a@b.c"));
    expect(screen.getByTestId("perm")).toHaveTextContent("yes");
  });
});