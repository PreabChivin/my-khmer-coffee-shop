"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  KeyRound,
  Power,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AdminCustomerRowDTO, Role } from "@/lib/types";

const ROLE_STYLE: Record<Role, string> = {
  CUSTOMER: "bg-coffee-100 text-coffee-600 dark:bg-coffee-900 dark:text-cream-300",
  STAFF: "bg-clay-100 text-clay-600 dark:bg-coffee-900 dark:text-clay-400",
  ADMIN: "bg-gold-100 text-gold-700 dark:bg-coffee-900 dark:text-gold-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** 👑 Admin-only — every registered account (staff AND customers), with role
 *  management and password resets. Rendered only for ADMIN sessions
 *  (AdminDashboard gates it), and every mutation is independently re-checked
 *  server-side by requireAdminRole. */
export default function AdminUserManagementPanel() {
  const { user: viewer } = useSession();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<AdminCustomerRowDTO[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminCustomerRowDTO | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminCustomerRowDTO | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminCustomerRowDTO | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<AdminCustomerRowDTO | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    fetch("/api/admin/customers")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: AdminCustomerRowDTO[]) => setRows(data))
      .catch(() => setError("Couldn't load accounts — the database may be busy."));
  }

  useEffect(() => {
    if (!isOpen || rows !== null) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.username ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  function handleRoleUpdated(id: string, role: Role) {
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, role } : r)) ?? null);
    setRoleTarget(null);
  }

  function handleDeactivationChanged(id: string, deactivatedAt: string | null) {
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, deactivatedAt } : r)) ?? null);
    setDeactivateTarget(null);
  }

  function handlePurged(id: string) {
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
    setPurgeTarget(null);
  }

  function handleStaffCreated(created: AdminCustomerRowDTO) {
    setRows((prev) => (prev ? [created, ...prev] : [created]));
    setShowCreate(false);
  }

  // Reactivating is the "undo" of a deliberate action — low-risk enough for
  // a direct single click, unlike deactivate/purge which open a confirm modal.
  async function handleReactivate(row: AdminCustomerRowDTO) {
    try {
      const res = await fetch(`/api/admin/customers/${row.id}/reactivate`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't reactivate that account.");
        return;
      }
      handleDeactivationChanged(row.id, null);
    } catch {
      setError("Network error — please try again.");
    }
  }

  return (
    <div className="khmer-card mx-auto mt-4 max-w-[1600px] rounded-2xl bg-cream-50/60 dark:bg-coffee-800/40">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          <ShieldCheck size={18} /> User Management · គ្រប់គ្រងគណនី
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
          {error && (
            <p className="mb-3 rounded-xl bg-crimson-50 px-3 py-2 text-xs font-medium text-crimson-600 dark:bg-coffee-950">
              {error}
            </p>
          )}

          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or username…"
              className="flex-1 rounded-xl border border-coffee-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
            />
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-clay-400 to-crimson-400 px-4 py-2 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              <UserPlus size={15} /> {t("account.addStaff")}
            </button>
          </div>

          {rows === null ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              Loading…
            </p>
          ) : visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              No accounts match.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-coffee-200 text-left text-xs uppercase tracking-wide text-coffee-400 dark:border-coffee-700 dark:text-cream-400">
                    <th className="px-2 py-2 font-bold">Account</th>
                    <th className="px-2 py-2 font-bold">Role</th>
                    <th className="px-2 py-2 font-bold">Joined</th>
                    <th className="px-2 py-2 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const isSelf = r.id === viewer?.id;
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-coffee-100 dark:border-coffee-800 ${r.deactivatedAt ? "opacity-50" : ""}`}
                      >
                        <td className="px-2 py-2.5">
                          <p className="font-semibold text-coffee-900 dark:text-cream-50">
                            {r.name} {isSelf && <span className="text-xs text-coffee-400">(you)</span>}
                          </p>
                          <p className="text-[11px] text-coffee-400 dark:text-cream-400">
                            {r.email}
                            {r.username ? ` · @${r.username}` : ""}
                          </p>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${ROLE_STYLE[r.role]}`}
                            >
                              {r.role}
                            </span>
                            {r.deactivatedAt && (
                              <span className="whitespace-nowrap rounded-full bg-crimson-100 px-2 py-0.5 text-xs font-bold text-crimson-600 dark:bg-coffee-950 dark:text-crimson-400">
                                {t("account.deactivated")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-coffee-600 dark:text-cream-300">
                          {formatDate(r.joinedAt)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => setRoleTarget(r)}
                              title={isSelf ? "Ask another admin to change your role" : "Change role"}
                              className="flex items-center gap-1 rounded-full border border-coffee-200 px-2.5 py-1 text-[11px] font-bold text-coffee-600 transition-colors hover:bg-clay-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-coffee-700 dark:text-cream-300 dark:hover:bg-coffee-900"
                            >
                              <ShieldCheck size={12} /> Role
                            </button>
                            <button
                              type="button"
                              onClick={() => setPasswordTarget(r)}
                              title="Reset password"
                              className="flex items-center gap-1 rounded-full border border-coffee-200 px-2.5 py-1 text-[11px] font-bold text-coffee-600 transition-colors hover:bg-clay-50 dark:border-coffee-700 dark:text-cream-300 dark:hover:bg-coffee-900"
                            >
                              <KeyRound size={12} /> Password
                            </button>
                            {r.deactivatedAt ? (
                              <button
                                type="button"
                                onClick={() => handleReactivate(r)}
                                title={t("account.reactivate")}
                                className="flex items-center gap-1 rounded-full border border-matcha-500 px-2.5 py-1 text-[11px] font-bold text-matcha-700 transition-colors hover:bg-matcha-100"
                              >
                                <Power size={12} /> {t("account.reactivate")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => setDeactivateTarget(r)}
                                title={isSelf ? "Ask another admin" : t("account.deactivate")}
                                className="flex items-center gap-1 rounded-full border border-coffee-200 px-2.5 py-1 text-[11px] font-bold text-coffee-600 transition-colors hover:bg-clay-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-coffee-700 dark:text-cream-300 dark:hover:bg-coffee-900"
                              >
                                <Power size={12} /> {t("account.deactivate")}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => setPurgeTarget(r)}
                              title={isSelf ? "Ask another admin" : t("account.purge")}
                              className="flex items-center gap-1 rounded-full border border-crimson-400 px-2.5 py-1 text-[11px] font-bold text-crimson-600 transition-colors hover:bg-crimson-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-crimson-400 dark:hover:bg-coffee-900"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
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

      {roleTarget && (
        <RoleModal
          target={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSaved={handleRoleUpdated}
        />
      )}
      {passwordTarget && (
        <PasswordModal target={passwordTarget} onClose={() => setPasswordTarget(null)} />
      )}
      {deactivateTarget && (
        <DeactivateModal
          target={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onDeactivated={(id, deactivatedAt) => handleDeactivationChanged(id, deactivatedAt)}
        />
      )}
      {purgeTarget && (
        <PurgeModal
          target={purgeTarget}
          onClose={() => setPurgeTarget(null)}
          onPurged={handlePurged}
        />
      )}
      {showCreate && (
        <CreateStaffModal onClose={() => setShowCreate(false)} onCreated={handleStaffCreated} />
      )}
    </div>
  );
}

function RoleModal({
  target,
  onClose,
  onSaved,
}: {
  target: AdminCustomerRowDTO;
  onClose: () => void;
  onSaved: (id: string, role: Role) => void;
}) {
  const [role, setRole] = useState<Role>(target.role);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${target.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't update role.");
        return;
      }
      onSaved(target.id, role);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

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
        <h2 className="font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          Change role
        </h2>
        <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">{target.name} · {target.email}</p>

        <div className="mt-4 flex flex-col gap-2">
          {(["CUSTOMER", "STAFF", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition-colors ${
                role === r
                  ? "border-clay-400 bg-clay-50 text-clay-700 dark:bg-coffee-900"
                  : "border-coffee-200 text-coffee-600 dark:border-coffee-700 dark:text-cream-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-crimson-50 px-3 py-2 text-xs font-medium text-crimson-600 dark:bg-coffee-950">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={busy || role === target.role}
          onClick={save}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function PasswordModal({
  target,
  onClose,
}: {
  target: AdminCustomerRowDTO;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${target.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't reset password.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

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
        <h2 className="font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          Reset password
        </h2>
        <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">{target.name} · {target.email}</p>

        {done ? (
          <p className="mt-4 rounded-xl bg-matcha-100 px-3 py-2 text-sm font-semibold text-matcha-700">
            Password updated. Share the new password with the account holder
            securely — it won&apos;t be shown again.
          </p>
        ) : (
          <form onSubmit={save} className="mt-4 space-y-3">
            <input
              required
              type="text"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min. 6 characters)"
              className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-3 py-2.5 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
            />
            {error && (
              <p className="rounded-xl bg-crimson-50 px-3 py-2 text-xs font-medium text-crimson-600 dark:bg-coffee-950">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function DeactivateModal({
  target,
  onClose,
  onDeactivated,
}: {
  target: AdminCustomerRowDTO;
  onClose: () => void;
  onDeactivated: (id: string, deactivatedAt: string | null) => void;
}) {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${target.id}/deactivate`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't deactivate that account.");
        return;
      }
      onDeactivated(target.id, data.deactivatedAt);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

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
        <h2 className="font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          {t("account.deactivateConfirmTitle")}
        </h2>
        <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">{target.name} · {target.email}</p>
        <p className="mt-3 text-sm text-coffee-700 dark:text-cream-200">
          {t("account.deactivateConfirmBody")}
        </p>

        {error && (
          <p className="mt-3 rounded-xl bg-crimson-50 px-3 py-2 text-xs font-medium text-crimson-600 dark:bg-coffee-950">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={confirm}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {busy ? "…" : t("account.deactivate")}
        </button>
      </div>
    </div>
  );
}

function PurgeModal({
  target,
  onClose,
  onPurged,
}: {
  target: AdminCustomerRowDTO;
  onClose: () => void;
  onPurged: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function purge(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${target.id}/purge`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't delete that account.");
        return;
      }
      onPurged(target.id);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-card relative w-full max-w-sm rounded-3xl border-2 border-crimson-400 bg-cream-50 p-6 dark:bg-coffee-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
        >
          <X size={18} />
        </button>
        <h2 className="flex items-center gap-1.5 font-heading text-lg font-extrabold text-crimson-600 dark:text-crimson-400">
          <Trash2 size={18} /> {t("account.purgeConfirmTitle")}
        </h2>
        <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">{target.name} · {target.email}</p>
        <p className="mt-3 text-sm text-coffee-700 dark:text-cream-200">
          {t("account.purgeConfirmBody")}
        </p>

        <form onSubmit={purge} className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-coffee-700 dark:text-cream-200">
            {t("account.purgeConfirmLabel")}
          </label>
          <input
            required
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={target.email}
            className="w-full rounded-xl border border-crimson-300 bg-cream-50 px-3 py-2.5 text-sm text-coffee-900 outline-none focus:border-crimson-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
          />
          {error && (
            <p className="rounded-xl bg-crimson-50 px-3 py-2 text-xs font-medium text-crimson-600 dark:bg-coffee-950">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || confirmText.trim().toLowerCase() !== target.email.toLowerCase()}
            className="w-full rounded-full bg-crimson-600 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-crimson-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "…" : t("account.purgeButton")}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateStaffModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (created: AdminCustomerRowDTO) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "STAFF" as "STAFF" | "ADMIN",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          username: form.username || undefined,
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create that account.");
        return;
      }
      onCreated(data as AdminCustomerRowDTO);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-coffee-300 bg-cream-50 px-3 py-2.5 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50";

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
        <h2 className="flex items-center gap-1.5 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          <UserPlus size={18} /> {t("account.addStaffTitle")}
        </h2>

        <form onSubmit={create} className="mt-4 space-y-3">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
          />
          <input
            placeholder="Username (optional)"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            className={inputCls}
          />
          <input
            required
            type="password"
            placeholder="Temporary password (min. 6 characters)"
            minLength={6}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className={inputCls}
          />
          <div className="flex gap-2">
            {(["STAFF", "ADMIN"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: r }))}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
                  form.role === r
                    ? "border-clay-400 bg-clay-50 text-clay-700 dark:bg-coffee-900"
                    : "border-coffee-200 text-coffee-600 dark:border-coffee-700 dark:text-cream-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {error && (
            <p className="rounded-xl bg-crimson-50 px-3 py-2 text-xs font-medium text-crimson-600 dark:bg-coffee-950">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {busy ? "…" : t("account.addStaff")}
          </button>
        </form>
      </div>
    </div>
  );
}
