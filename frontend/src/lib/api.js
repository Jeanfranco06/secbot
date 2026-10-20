/**
 * Cliente HTTP con:
 * - JWT en Authorization
 * - Refresh automático en 401 (una vez por request)
 * - Timeout, retry exponencial, cancelación
 * - Errores normalizados
 */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";
const TIMEOUT = 30000;

export const TOKEN_KEY = "secbot.access";
export const REFRESH_KEY = "secbot.refresh";

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.headers["X-Request-ID"] = crypto.randomUUID?.() ?? String(Date.now());
  return cfg;
});

let refreshing = null;

async function refreshToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new ApiError("Sin refresh token", 401, "no_refresh");
  const { data } = await axios.post(
    `${API_URL}/api/v1/auth/refresh`,
    {},
    { headers: { Authorization: `Bearer ${refresh}` }, timeout: TIMEOUT },
  );
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_KEY, data.refresh_token);
  return data.access_token;
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config || {};
    const status = err.response?.status;

    if (status === 401 && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;
      try {
        refreshing = refreshing || refreshToken();
        const token = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
        throw new ApiError("Sesión expirada", 401, "session_expired");
      }
    }

    const data = err.response?.data;
    throw new ApiError(
      data?.message || data?.detail || err.message || "Error de red",
      status || 0,
      data?.error || "network_error",
      data?.details,
    );
  },
);

// ---------- Helpers de dominio ----------

export const authApi = {
  login: (email, password) =>
    api.post("/api/v1/auth/login", { email, password }).then((r) => r.data),
  logout: () => api.post("/api/v1/auth/logout").catch(() => {}),
  me: () => api.get("/api/v1/auth/me").then((r) => r.data),
  ssoProviders: () => api.get("/api/v1/sso/providers").then((r) => r.data),
};

export const chatApi = {
  send: (message, chatId) =>
    api.post("/api/v1/chat/messages", { message, chat_id: chatId }).then((r) => r.data),
  history: () => api.get("/api/v1/chat/history").then((r) => r.data),
  chat: (id) => api.get(`/api/v1/chat/history/${id}`).then((r) => r.data),
  feedback: (message_id, rating, comment) =>
    api.post("/api/v1/chat/feedback", { message_id, rating, comment }).then((r) => r.data),
};

export const ticketsApi = {
  list: (params = {}) => api.get("/api/v1/tickets", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/v1/tickets/${id}`).then((r) => r.data),
  update: (id, patch) => api.patch(`/api/v1/tickets/${id}`, patch).then((r) => r.data),
  label: (id, payload) => api.post(`/api/v1/tickets/${id}/label`, payload).then((r) => r.data),
};

export const adminApi = {
  users: (params = {}) => api.get("/api/v1/admin/users", { params }).then((r) => r.data),
  createUser: (payload) => api.post("/api/v1/admin/users", payload).then((r) => r.data),
  updateUser: (id, patch) => api.patch(`/api/v1/admin/users/${id}`, patch).then((r) => r.data),
  deactivateUser: (id) => api.delete(`/api/v1/admin/users/${id}`).then((r) => r.data),
  resetPassword: (id, new_password) =>
    api.post(`/api/v1/admin/users/${id}/reset-password`, { new_password }).then((r) => r.data),
  roles: () => api.get("/api/v1/admin/roles").then((r) => r.data),
  permissions: () => api.get("/api/v1/admin/permissions").then((r) => r.data),
  setRolePermissions: (roleId, permissions) =>
    api.put(`/api/v1/admin/roles/${roleId}/permissions`, { permissions }).then((r) => r.data),
  audit: (params = {}) => api.get("/api/v1/admin/audit", { params }).then((r) => r.data),
};

export const dashboardApi = {
  summary: (days) =>
    api.get("/api/v1/dashboard/summary", { params: { days } }).then((r) => r.data),
};

export const reportsApi = {
  operational: (days) =>
    api.get("/api/v1/reports/operational", { params: { days } }).then((r) => r.data),
  management: (months) =>
    api.get("/api/v1/reports/management", { params: { months } }).then((r) => r.data),
  export: async (report, format, days) => {
    const res = await api.get("/api/v1/reports/export", {
      params: { report, format, days },
      responseType: "blob",
    });
    return res.data;
  },
  exports: () => api.get("/api/v1/reports/exports").then((r) => r.data),
};

export const kbApi = {
  documents: (status) =>
    api.get("/api/v1/kb/documents", { params: status ? { status } : {} }).then((r) => r.data),
  stats: () => api.get("/api/v1/kb/stats").then((r) => r.data),
  upload: (formData) =>
    api.post("/api/v1/kb/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
  obsolete: (id) => api.post(`/api/v1/kb/documents/${id}/obsolete`).then((r) => r.data),
};

export const sessionsApi = {
  list: () => api.get("/api/v1/sessions").then((r) => r.data),
  revoke: (id) => api.delete(`/api/v1/sessions/${id}`).then((r) => r.data),
};

export const complianceApi = {
  evidence: () => api.get("/api/v1/compliance/evidence").then((r) => r.data),
};

export const healthApi = {
  deep: () => api.get("/health/deep").then((r) => r.data),
};

export function saveTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}