import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, clearTokens, getAccessToken, saveTokens } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    saveTokens(data.access_token, data.refresh_token);
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const loginWithTokens = useCallback(async (access, refresh) => {
    saveTokens(access, refresh);
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    clearTokens();
    setUser(null);
  }, []);

  const has = useCallback((perm) => Boolean(user?.permissions?.includes(perm)), [user]);
  const hasAny = useCallback((...perms) => perms.some((p) => user?.permissions?.includes(p)), [user]);

  const value = useMemo(
    () => ({ user, loading, login, loginWithTokens, logout, refresh: loadUser, has, hasAny }),
    [user, loading, login, loginWithTokens, logout, loadUser, has, hasAny],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}