"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Lock, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import AppearanceSettings from "@/components/AppearanceSettings";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Login failed");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-coffee-900 px-4">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageToggle />
        <AppearanceSettings />
      </div>

      <div className="khmer-frame w-full max-w-sm rounded-2xl bg-cream-50 p-8 dark:bg-coffee-800">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-500 bg-coffee-800 text-gold-400">
            <Coffee size={22} />
          </span>
          <h1 className="mt-3 font-heading text-2xl text-coffee-900 dark:text-cream-50">
            {t("adminLogin.title")}
          </h1>
          <p className="mt-1 text-sm text-coffee-500 dark:text-cream-300">
            {t("adminLogin.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full rounded-xl border border-coffee-300 bg-cream-50 py-2.5 pl-9 pr-4 text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
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
                className="w-full rounded-xl border border-coffee-300 bg-cream-50 py-2.5 pl-9 pr-4 text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
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
            className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-coffee-900 transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:bg-coffee-300"
          >
            {isSubmitting ? t("adminLogin.signingIn") : t("adminLogin.signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}
