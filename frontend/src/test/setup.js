import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock de matchMedia
window.matchMedia = window.matchMedia || ((query) => ({
  matches: false, media: query, addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
}));

// Mock de crypto.randomUUID
if (!global.crypto?.randomUUID) {
  global.crypto = { ...(global.crypto || {}), randomUUID: () => "00000000-0000-0000-0000-000000000000" };
}

// Mock de WebSocket
class MockWebSocket {
  constructor() { this.readyState = 1; setTimeout(() => this.onopen?.(), 0); }
  send() {}
  close() { this.onclose?.(); }
}
vi.stubGlobal("WebSocket", MockWebSocket);