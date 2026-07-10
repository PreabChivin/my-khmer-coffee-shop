"use client";

import { useState } from "react";
import { Lock, Mail, Phone, User as UserIcon, X } from "lucide-react";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";

// Social providers are scaffolded (DB fields + these slots) but need OAuth
// credentials to be wired — shown disabled until then.
const SOCIALS = [
  { key: "google", label: "Google", emoji: "🟦" },
  { key: "facebook", label: "Facebook", emoji: "🔵" },
  { key: "telegram", label: "Telegram", emoji: "✈️" },
];

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useCustomerSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    identifier: "",
    email: "",
    password: "",
    name: "",
    username: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res =
      mode === "login"
        ? await login(form.identifier, form.password)
        : await register({
            email: form.email,
            password: form.password,
            name: form.name,
            username: form.username || undefined,
            phone: form.phone || undefined,
          });
    setBusy(false);
    if (res.ok) onClose();
    else setError(res.error ?? "Something went wrong");
  }

  const inputCls =
    "w-full rounded-xl border border-coffee-300 bg-cream-50 py-2.5 pl-9 pr-4 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-card relative w-full max-w-sm rounded-3xl bg-cream-50 p-6 dark:bg-coffee-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="animate-bounce-cute text-4xl">🧋💖</div>
          <h2 className="mt-1 font-heading text-xl text-coffee-900 dark:text-cream-50">
            {mode === "login" ? "សូមស្វាគមន៍ត្រឡប់មកវិញ!" : "បង្កើតគណនីថ្មី"}
          </h2>
          <p className="text-xs text-coffee-500 dark:text-cream-300">
            {mode === "login"
              ? "ចូលគណនីដើម្បីមើលការកម្ម៉ង់ + សន្សំពិន្ទុ 💎"
              : "ចុះឈ្មោះដើម្បីសន្សំពិន្ទុ និងទទួលរង្វាន់ 🎁"}
          </p>
        </div>

        {/* Login/Register tabs */}
        <div className="mt-4 flex rounded-full bg-coffee-100 p-1 dark:bg-coffee-900">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 rounded-full py-1.5 text-sm font-bold transition-colors ${
                mode === m
                  ? "bg-gradient-to-r from-clay-400 to-crimson-400 text-white shadow"
                  : "text-coffee-500 dark:text-cream-300"
              }`}
            >
              {m === "login" ? "ចូល" : "ចុះឈ្មោះ"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === "register" && (
            <div className="relative">
              <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
              <input
                required
                placeholder="ឈ្មោះ / Name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {mode === "login" ? (
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
              <input
                required
                placeholder="អ៊ីមែល ឬ Username"
                value={form.identifier}
                onChange={(e) => set("identifier", e.target.value)}
                className={inputCls}
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input
                  required
                  type="email"
                  placeholder="អ៊ីមែល / Email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                <input
                  placeholder="លេខទូរស័ព្ទ (មិនចាំបាច់)"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputCls}
                />
              </div>
            </>
          )}

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
            <input
              required
              type="password"
              placeholder="ពាក្យសម្ងាត់ / Password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={inputCls}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-crimson-50 px-3 py-2 text-xs font-medium text-crimson-600 dark:bg-coffee-950">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {busy ? "កំពុងដំណើរការ..." : mode === "login" ? "ចូល 💖" : "បង្កើតគណនី 🎉"}
          </button>
        </form>

        {/* 🔮 Social login slots — wired once OAuth credentials are added */}
        <div className="mt-4">
          <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-coffee-400 dark:text-cream-400">
            ឬចូលដោយ · or continue with
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SOCIALS.map((s) => (
              <button
                key={s.key}
                type="button"
                disabled
                title="Coming soon"
                className="flex cursor-not-allowed items-center justify-center gap-1 rounded-xl border border-coffee-200 bg-coffee-50 py-2 text-xs font-semibold text-coffee-400 opacity-70 dark:border-coffee-700 dark:bg-coffee-900"
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-center text-[10px] text-coffee-400 dark:text-cream-400">
            ឆាប់ៗនេះ · coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
