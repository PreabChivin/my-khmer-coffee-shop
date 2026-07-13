"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import AuthModal from "@/components/AuthModal";

interface AuthModalValue {
  openAuth: () => void;
  closeAuth: () => void;
}

const AuthModalContext = createContext<AuthModalValue | undefined>(undefined);

/**
 * Centralises the login/register modal so any component (header button,
 * first-visit welcome popup, checkout, …) can summon it with `openAuth()`.
 * Rendered once, portaled to body. Must live inside SessionProvider.
 */
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openAuth = useCallback(() => setIsOpen(true), []);
  const closeAuth = useCallback(() => setIsOpen(false), []);

  return (
    <AuthModalContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(<AuthModal onClose={closeAuth} />, document.body)}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within an AuthModalProvider");
  return ctx;
}
