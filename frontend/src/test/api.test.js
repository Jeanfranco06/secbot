import { describe, it, expect } from "vitest";
import { getAccessToken, saveTokens, clearTokens } from "@/lib/api";

describe("api token storage", () => {
  it("guarda y limpia tokens en memoria/storage", () => {
    saveTokens("test_access", "test_refresh");
    expect(getAccessToken()).toBe("test_access");
    clearTokens();
    expect(getAccessToken()).toBeNull();
  });
});
