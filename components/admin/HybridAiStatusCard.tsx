"use client";

import { useEffect, useState } from "react";
import { Cpu, CheckCircle2, PlugZap } from "lucide-react";

/**
 * 🐍🔌 Hybrid AI Service status — a compact admin card that pings the Next.js
 * bridge (/api/ai/health), which in turn probes the decoupled Python sidecar.
 * This is how the Staff Dashboard "connects to" the new Python endpoint without
 * disturbing any existing analytics: the real metrics still come from the
 * built-in TypeScript panels, and this card just reports whether the optional
 * Python engine is wired up and reachable.
 */
interface HealthResponse {
  connected: boolean;
  configured: boolean;
  dbConnected?: boolean;
  version?: string;
  message?: string;
}

export default function HybridAiStatusCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setHealth(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const connected = health?.connected === true;

  return (
    <div className="khmer-card mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-coffee-50 to-cream-100 p-4 dark:from-coffee-800 dark:to-coffee-900">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          connected
            ? "bg-matcha-100 text-matcha-700 dark:bg-coffee-900 dark:text-matcha-400"
            : "bg-coffee-100 text-coffee-500 dark:bg-coffee-900 dark:text-cream-300"
        }`}
      >
        <Cpu size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
          Hybrid AI Service · Python
        </p>
        {!loaded ? (
          <p className="text-sm font-semibold text-coffee-400 dark:text-cream-400">កំពុងពិនិត្យ…</p>
        ) : connected ? (
          <p className="flex items-center gap-1.5 text-sm font-bold text-matcha-600 dark:text-matcha-400">
            <CheckCircle2 size={15} /> Connected
            {health?.version && (
              <span className="font-medium text-coffee-400 dark:text-cream-400">v{health.version}</span>
            )}
            <span className="font-medium text-coffee-400 dark:text-cream-400">
              · DB {health?.dbConnected ? "✓" : "—"}
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-sm font-bold text-coffee-500 dark:text-cream-300">
            <PlugZap size={15} /> Offline — using built-in analytics
          </p>
        )}
      </div>
    </div>
  );
}
