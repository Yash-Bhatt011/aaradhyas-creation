import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("ac_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((res) => setAdmin(res.admin))
      .catch((err) => {
        // Only log out on a genuine auth rejection (401 = expired/invalid token).
        // A network error or 5xx usually just means the backend is asleep or
        // restarting (common on Render's free tier, which spins down after
        // inactivity and takes ~30-50s to wake). Wiping the token there would
        // log the admin out for no reason, so we keep it and let them retry.
        if (err?.status === 401) {
          localStorage.removeItem("ac_admin_token");
          setAdmin(null);
        } else {
          console.warn("Could not verify session (backend may be waking up):", err?.message);
          setAuthError("Could not reach the server. It may be starting up — please refresh in a moment.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const res = await api.login(email, password);
    localStorage.setItem("ac_admin_token", res.token);
    setAdmin(res.admin);
    return res.admin;
  };

  const logout = () => {
    localStorage.removeItem("ac_admin_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
