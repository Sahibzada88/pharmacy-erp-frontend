"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore, apiErrorMessage } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<User>("/auth/me/");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const access = tokenStore.getAccess();
    if (!access) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const { data } = await api.post("/auth/login/", { username, password });
        tokenStore.set(data.access, data.refresh);
        setUser(data.user);
      } catch (err) {
        throw new Error(apiErrorMessage(err) || "Invalid username or password.");
      }
    },
    []
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Human-friendly labels for role badges across the UI. */
export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  MANAGER: "Branch Manager",
  CASHIER: "Cashier",
  ACCOUNTANT: "Accountant",
  PHARMACIST: "Pharmacist",
};

/** Default landing route per role after login. */
export const ROLE_HOME: Record<string, string> = {
  OWNER: "/owner",
  MANAGER: "/owner",
  CASHIER: "/pos",
  ACCOUNTANT: "/finance",
  PHARMACIST: "/inventory",
};
