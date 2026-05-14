/**
 * Auth context — JWT in localStorage, applies brand color + theme mode on every load.
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api";
import { applyBrandColor, resetBrandColor, applyMode, loadStoredMode } from "./theme";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyTheme = useCallback((u) => {
    if (u?.studio?.brand_color) applyBrandColor(u.studio.brand_color);
    else resetBrandColor();
    const mode = u?.theme_preference || loadStoredMode();
    applyMode(mode);
  }, []);

  // Apply stored mode on initial mount (before user loads)
  useEffect(() => { applyMode(loadStoredMode()); }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("fs_access");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      applyTheme(data);
    } catch {
      localStorage.removeItem("fs_access");
      localStorage.removeItem("fs_refresh");
    }
    setLoading(false);
  }, [applyTheme]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("fs_access", data.access);
    localStorage.setItem("fs_refresh", data.refresh);
    setUser(data.user);
    applyTheme(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("fs_access", data.access);
    localStorage.setItem("fs_refresh", data.refresh);
    setUser(data.user);
    applyTheme(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("fs_access");
    localStorage.removeItem("fs_refresh");
    setUser(null);
    resetBrandColor();
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, login, register, logout, refreshUser: fetchMe, applyTheme,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
