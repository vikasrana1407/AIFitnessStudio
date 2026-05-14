/**
 * Auth context — JWT access/refresh stored in localStorage.
 * Also applies the active studio's brand color to CSS variables on login.
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api";
import { applyBrandColor, resetBrandColor } from "./theme";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyTheme = useCallback((u) => {
    if (u?.studio?.brand_color) applyBrandColor(u.studio.brand_color);
    else resetBrandColor();
  }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("fs_access");
    if (!token) {
      setLoading(false);
      return;
    }
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: fetchMe, applyTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
