"use client";

import { useEffect, useRef, useState } from "react";
import { Cpu, PlugZap, Zap } from "lucide-react";

/**
 * 🐍🔌 Hybrid AI Service status — a compact admin card that LIVE-polls the
 * Next.js bridge (/api/ai/health), which in turn probes the decoupled Python
 * sidecar. Because it re-checks on an interval, the card flips to
 * "ONLINE — Hybrid AI Active" on its own the moment a Python host becomes
 * reachable (e.g. after you `npm run dev:all` locally, or point
 * PYTHON_AI_SERVICE_URL at a deployed sidecar) — no page reload or redeploy.
 * When the service isn't configured/reachable it degrades to the built-in
 * TypeScript analytics, which is the normal state on Vercel prod (serverless
 * can't host a long-lived Uvicorn process — see backend-py/README.md).
 */
interface HealthResponse {
  connected: boolean;
  configured: boolean;
  dbConnected?: boolean;
  version?: string;
  uptimeSeconds?: number;
  message?: string;
}

const POLL_INTERVAL_MS = 20000;

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function HybridAiStatusCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function ping() {
      try {
        const res = await fetch("/api/ai/health", { cache: "no-store" });
        const data = res.ok ? ((await res.json()) as HealthResponse) : null;
        if (!cancelledRef.current) {
          setHealth(data);
          setLoaded(true);
        }
      } catch {
        if (!cancelledRef.current) {
          setHealth(null);
          setLoaded(true);
        }
      }
    }

    ping();
    const interval = setInterval(ping, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, []);

  const connected = health?.connected === true;

  return (
    <div
      className={`khmer-card mb-6 flex items-center gap-3 rounded-2xl p-4 transition-colors ${
        connected
          ? "bg-gradient-to-br from-matcha-50 to-cream-100 dark:from-coffee-800 dark:to-coffee-900"
          : "bg-gradient-to-br from-coffee-50 to-cream-100 dark:from-coffee-800 dark:to-coffee-900"
      }`}
    >
      <span
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          connected
            ? "bg-matcha-100 text-matcha-700 dark:bg-coffee-900 dark:text-matcha-400"
            : "bg-coffee-100 text-coffee-500 dark:bg-coffee-900 dark:text-cream-300"
        }`}
      >
        <Cpu size={20} />
        {connected && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-matcha-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-matcha-500" />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
          Hybrid AI Service · Python
        </p>
        {!loaded ? (
          <p className="text-sm font-semibold text-coffee-400 dark:text-cream-400">កំពុងពិនិត្យ…</p>
        ) : connected ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-bold text-matcha-600 dark:text-matcha-400">
            <span className="flex items-center gap-1">
              <Zap size={15} className="fill-matcha-500" /> ONLINE — Hybrid AI Active
            </span>
            <span className="font-medium text-coffee-400 dark:text-cream-400">
              {health?.version && `v${health.version} · `}
              DB {health?.dbConnected ? "connected ✓" : "offline —"}
              {typeof health?.uptimeSeconds === "number" &&
                ` · up ${formatUptime(health.uptimeSeconds)}`}
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
