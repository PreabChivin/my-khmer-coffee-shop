"use client";

import { useState } from "react";
import { Lock, User, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import BongBear from "@/components/mascots/BongBear";

export default function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { login } = useAdminSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Login failed");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-card relative w-full max-w-sm rounded-3xl bg-cream-50 p-7 dark:bg-coffee-800">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("customize.cancel")}
          className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <BongBear pose="wave" size={80} />
          <h1 className="mt-2 font-heading text-xl text-coffee-900 dark:text-cream-50">
            {t("adminLogin.title")}
          </h1>
          <p className="mt-1 text-sm text-coffee-500 dark:text-cream-300">
            {t("adminLogin.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-700 dark:text-cream-200">
              {t("adminLogin.username")}
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400"
              />
              <input
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-coffee-300 bg-cream-50 py-2.5 pl-9 pr-4 text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-700 dark:text-cream-200">
              {t("adminLogin.password")}
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400"
              />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-coffee-300 bg-cream-50 py-2.5 pl-9 pr-4 text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-3 font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {isSubmitting ? t("adminLogin.signingIn") : t("adminLogin.signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}
