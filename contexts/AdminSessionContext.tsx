"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AdminSessionContextValue {
  /** null while the initial /api/admin/me check is in flight, or logged out. */
  adminName: string | null;
  /** true the instant login succeeds — this alone flips the whole UI into
   *  Staff view. There is no separate "editing mode" step. */
  isAdmin: boolean;
  isChecking: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue | undefined>(
  undefined
);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [adminName, setAdminName] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setAdminName(data?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) setAdminName(null);
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "Login failed" };
      setAdminName(data.name ?? username);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error — please try again" };
    }
  }, []);

  // Logging out destroys the session server-side (cookie cleared) AND
  // client-side (any device-local staff state), flipping the UI back to the
  // default customer layout instantly.
  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdminName(null);
  }, []);

  const value: AdminSessionContextValue = {
    adminName,
    isAdmin: adminName !== null,
    isChecking,
    login,
    logout,
  };

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminSessionContextValue {
  const context = useContext(AdminSessionContext);
  if (!context)
    throw new Error("useAdminSession must be used within an AdminSessionProvider");
  return context;
}
