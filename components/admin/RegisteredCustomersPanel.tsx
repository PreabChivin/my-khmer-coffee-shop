"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import CustomerHistoryModal from "@/components/admin/CustomerHistoryModal";
import { generationFromDOB } from "@/lib/generation";
import type { AdminCustomerRowDTO } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** 👥 Registered Customers — full customer roster with generation, points,
 *  joined date, and order count. Rows open the lifetime-history + LTV modal. */
export default function RegisteredCustomersPanel({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<AdminCustomerRowDTO[] | null>(null);
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || rows !== null) return;
    fetch("/api/admin/customers")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: AdminCustomerRowDTO[]) => setRows(data))
      .catch(() => onError("Couldn't load customers — the database may be busy."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }, [rows, query]);

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
              {rows.length}
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="border-t border-coffee-200 px-4 py-3 dark:border-coffee-700">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ ឬ អ៊ីមែល..."
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
                    <th className="px-2 py-2 text-right font-bold">ការកម្ម៉ង់ · Orders</th>
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
                          <p className="font-semibold text-coffee-900 dark:text-cream-50">
                            {c.name}
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
                          {c.orderCount}
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
    </div>
  );
}
