import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";
import { clearToken, getToken, setToken } from "./tokenStorage";

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  rating: number;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    api
      .get<{ user: AuthUser }>("/api/auth/me")
      .then((res) => {
        setUser(res.user);
        setStatus("authenticated");
      })
      .catch(() => {
        clearToken();
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>("/api/auth/login", { email, password });
    setToken(res.token);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (email: string, password: string, nickname: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>("/api/auth/register", {
      email,
      password,
      nickname,
    });
    setToken(res.token);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    api.post("/api/auth/logout").catch(() => {});
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
