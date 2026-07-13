"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserDTO } from "@/lib/types";

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  dateOfBirth: string;
  username?: string;
  phone?: string;
}

interface SessionValue {
  user: UserDTO | null;
  isLoading: boolean;
  /** STAFF or ADMIN — can use the Admin Dashboard. */
  isStaff: boolean;
  /** ADMIN only — can use the User Management panel. */
  isAdminRole: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string; role?: UserDTO["role"] }>;
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string; role?: UserDTO["role"] }>;
  logout: () => Promise<void>;
  /** Re-reads the account (e.g. to reflect newly-earned loyalty points). */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

/**
 * 🔐 One unified session for every role — customers AND staff/admins are all
 * just a `User` row now, differentiated by `role`. Replaces the old separate
 * AdminSessionProvider + CustomerSessionProvider.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!cancelled) setUser(data.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Login failed" };
      setUser(data as UserDTO);
      return { ok: true, role: (data as UserDTO).role };
    } catch {
      return { ok: false, error: "Network error — please try again." };
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Sign-up failed" };
      setUser(data as UserDTO);
      return { ok: true, role: (data as UserDTO).role };
    } catch {
      return { ok: false, error: "Network error — please try again." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value: SessionValue = {
    user,
    isLoading,
    isStaff: user?.role === "STAFF" || user?.role === "ADMIN",
    isAdminRole: user?.role === "ADMIN",
    login,
    register,
    logout,
    refresh,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
