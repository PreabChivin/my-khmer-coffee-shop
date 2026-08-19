"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Users, Bot, Trash2, X } from "lucide-react";
import CustomerHistoryModal from "@/components/admin/CustomerHistoryModal";
import { generationFromDOB } from "@/lib/generation";
import type { AdminCustomerRowDTO } from "@/lib/types";

const PURGE_CONFIRM_PHRASE = "DELETE TEST ACCOUNTS";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** 👥 Registered Customers — full customer roster with generation, points,
 *  joined date, and arcade wins. Rows open the player scoreboard modal. */
export default function RegisteredCustomersPanel({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<AdminCustomerRowDTO[] | null>(null);
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showPurge, setShowPurge] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [purging, setPurging] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  function loadCustomers() {
    fetch("/api/admin/customers")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: AdminCustomerRowDTO[]) => setRows(data))
      .catch(() => onError("Couldn't load customers — the database may be busy."));
  }

  useEffect(() => {
    if (!isOpen || rows !== null) return;
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Staff/Admin accounts live in the same table now (role) — this roster
  // stays customer-only; STAFF/ADMIN accounts are managed in the separate
  // User Management panel (ADMIN only).
  const customers = useMemo(
    () => (rows ?? []).filter((r) => r.role === "CUSTOMER"),
    [rows]
  );
  const testAccountCount = useMemo(
    () => customers.filter((c) => c.isTestAccount).length,
    [customers]
  );

  async function purgeTestAccounts() {
    setPurging(true);
    setPurgeError(null);
    try {
      const res = await fetch("/api/admin/customers/purge-test-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: purgeConfirmText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPurgeError(data.error ?? "Couldn't purge test accounts.");
        return;
      }
      setShowPurge(false);
      setPurgeConfirmText("");
      loadCustomers();
    } catch {
      setPurgeError("Network error — please try again.");
    } finally {
      setPurging(false);
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <div className="khmer-card mx-auto mt-4 max-w-[1600px] rounded-2xl bg-cream-50/60 dark:bg-coffee-800/40">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          <Users size={18} /> អតិថិជនដែលបានចុះឈ្មោះ · Registered Customers
          {rows && (
            <span className="rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-bold text-coffee-600 dark:bg-coffee-900 dark:text-cream-200">
              {customers.length}
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="border-t border-coffee-200 px-4 py-3 dark:border-coffee-700">
          {testAccountCount > 0 && (
            <button
              type="button"
              onClick={() => setShowPurge(true)}
              className="mb-3 flex items-center gap-1.5 rounded-full bg-crimson-100 px-3 py-1.5 text-xs font-bold text-crimson-700 transition-transform hover:scale-105 dark:bg-coffee-900 dark:text-crimson-400"
            >
              <Bot size={13} /> {testAccountCount} test account{testAccountCount === 1 ? "" : "s"}
              <Trash2 size={12} />
            </button>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬ លេខទូរស័ព្ទ..."
            className="mb-3 w-full rounded-xl border border-coffee-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
          />

          {rows === null ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              កំពុងផ្ទុក...
            </p>
          ) : visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              មិនមានអតិថិជនទេ
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-coffee-200 text-left text-xs uppercase tracking-wide text-coffee-400 dark:border-coffee-700 dark:text-cream-400">
                    <th className="px-2 py-2 font-bold">ឈ្មោះពិត · Real Name</th>
                    <th className="px-2 py-2 font-bold">ជេន · Gen</th>
                    <th className="px-2 py-2 text-right font-bold">ពិន្ទុ · Points</th>
                    <th className="px-2 py-2 font-bold">ចូលរួម · Joined</th>
                    <th className="px-2 py-2 text-right font-bold">ឈ្នះ · Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => {
                    const gen = generationFromDOB(c.dateOfBirth);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setCustomerId(c.id)}
                        className="cursor-pointer border-b border-coffee-100 transition-colors hover:bg-clay-50 dark:border-coffee-800 dark:hover:bg-coffee-900"
                      >
                        <td className="px-2 py-2.5">
                          <p className="flex items-center gap-1.5 font-semibold text-coffee-900 dark:text-cream-50">
                            {c.name}
                            {c.isTestAccount && (
                              <span className="flex items-center gap-0.5 rounded-full bg-crimson-100 px-1.5 py-0.5 text-[9px] font-extrabold text-crimson-600 dark:bg-coffee-900 dark:text-crimson-400">
                                <Bot size={9} /> TEST
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-coffee-400 dark:text-cream-400">
                            {c.email}
                          </p>
                        </td>
                        <td className="px-2 py-2.5">
                          {gen ? (
                            <span className="whitespace-nowrap rounded-full bg-clay-100 px-2 py-0.5 text-xs font-bold text-clay-600 dark:bg-coffee-900 dark:text-clay-400">
                              {gen.emoji} {gen.label}
                            </span>
                          ) : (
                            <span className="text-xs text-coffee-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right font-bold text-coffee-900 dark:text-cream-50">
                          {c.loyaltyPoints.toLocaleString()} 💎
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-coffee-600 dark:text-cream-300">
                          {formatDate(c.joinedAt)}
                        </td>
                        <td className="px-2 py-2.5 text-right font-semibold text-coffee-700 dark:text-cream-200">
                          🏆 {c.gameWins}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {customerId && (
        <CustomerHistoryModal userId={customerId} onClose={() => setCustomerId(null)} />
      )}

      {showPurge && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
          <div className="khmer-card relative w-full max-w-sm rounded-3xl bg-cream-50 p-6 dark:bg-coffee-800">
            <button
              type="button"
              onClick={() => {
                setShowPurge(false);
                setPurgeConfirmText("");
                setPurgeError(null);
              }}
              aria-label="Close"
              className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
            >
              <X size={18} />
            </button>

            <h3 className="flex items-center gap-1.5 font-heading text-lg text-coffee-900 dark:text-cream-50">
              <Bot size={18} /> Purge Test Accounts
            </h3>
            <p className="mt-2 text-sm text-coffee-600 dark:text-cream-300">
              This will permanently delete <strong>{testAccountCount}</strong> account
              {testAccountCount === 1 ? "" : "s"} flagged as automated/AI test accounts
              (@{"claude-agent-test.local"} sign-ups). This cannot be undone.
            </p>
            <p className="mt-3 text-xs font-semibold text-coffee-500 dark:text-cream-400">
              Type <span className="font-mono text-crimson-600 dark:text-crimson-400">{PURGE_CONFIRM_PHRASE}</span> to confirm.
            </p>
            <input
              value={purgeConfirmText}
              onChange={(e) => setPurgeConfirmText(e.target.value)}
              placeholder={PURGE_CONFIRM_PHRASE}
              className="mt-2 w-full rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
            />
            {purgeError && (
              <p className="mt-2 text-xs font-semibold text-crimson-600">{purgeError}</p>
            )}
            <button
              type="button"
              onClick={purgeTestAccounts}
              disabled={purging || purgeConfirmText.trim() !== PURGE_CONFIRM_PHRASE}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-600 py-2.5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} /> {purging ? "Purging..." : `Permanently Delete ${testAccountCount}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
