"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import CategoryIcon from "@/components/menu/CategoryIcon";
import type { CategoryDTO } from "@/lib/types";

const EMPTY_FORM = { name: "", iconKey: "", iconUrl: "" };

/** 🍩 Category Manager — lives at the top of the Menu & Partner CMS panel.
 *  Create/rename/delete categories with real-time optimistic updates; every
 *  mutation resolves against /api/categories in the background. */
export default function CategoryManager({
  categories,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
  onError,
}: {
  categories: CategoryDTO[];
  onCategoryCreated: (created: CategoryDTO) => void;
  onCategoryUpdated: (updated: CategoryDTO) => void;
  onCategoryDeleted: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      onError("Category name is required.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          iconKey: form.iconKey || null,
          iconUrl: form.iconUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create category");
      onCategoryCreated(data);
      setForm(EMPTY_FORM);
      setIsAdding(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(category: CategoryDTO) {
    setEditingId(category.id);
    setEditName(category.name);
  }

  async function commitRename(category: CategoryDTO) {
    const trimmed = editName.trim();
    setEditingId(null);
    if (!trimmed || trimmed === category.name) return;

    const previous = category.name;
    onCategoryUpdated({ ...category, name: trimmed });
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        onCategoryUpdated({ ...category, name: previous });
        onError(data?.error ?? "Couldn't rename that category.");
        return;
      }
      onCategoryUpdated(await res.json());
    } catch {
      onCategoryUpdated({ ...category, name: previous });
      onError("Network error — please check your connection and try again.");
    }
  }

  async function handleDelete(category: CategoryDTO) {
    const productCount = category.productCount ?? 0;
    const warning =
      productCount > 0
        ? `Delete "${category.name}"? This will also permanently delete ${productCount} product${productCount === 1 ? "" : "s"} in this category. This cannot be undone.`
        : `Delete "${category.name}"? This cannot be undone.`;
    if (!confirm(warning)) return;

    onCategoryDeleted(category.id);
    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        onCategoryCreated(category); // rollback: add it back
        onError(data?.error ?? "Couldn't delete that category.");
      }
    } catch {
      onCategoryCreated(category);
      onError("Network error — please check your connection and try again.");
    }
  }

  return (
    <div className="mb-3 rounded-2xl border border-coffee-200 bg-white/60 dark:border-coffee-700 dark:bg-coffee-900/40">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 font-heading text-sm font-extrabold text-coffee-900 dark:text-cream-50">
          🍩 Category Manager
          <span className="rounded-full bg-coffee-100 px-2 py-0.5 text-[11px] font-bold text-coffee-600 dark:bg-coffee-800 dark:text-cream-200">
            {categories.length}
          </span>
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="border-t border-coffee-200 px-4 py-3 dark:border-coffee-700">
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 rounded-xl border border-coffee-200 bg-cream-50 px-2.5 py-2 dark:border-coffee-700 dark:bg-coffee-900"
              >
                <CategoryIcon category={category} size={22} className="shrink-0 text-clay-500" />
                {editingId === category.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => commitRename(category)}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    className="min-w-0 flex-1 rounded-md border border-gold-500 bg-white px-2 py-1 text-sm text-coffee-900 outline-none dark:bg-coffee-800 dark:text-cream-50"
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-coffee-800 dark:text-cream-100">
                    {category.name}
                  </span>
                )}
                <span className="shrink-0 rounded-full bg-coffee-100 px-2 py-0.5 text-[10px] font-bold text-coffee-500 dark:bg-coffee-800 dark:text-cream-300">
                  {category.productCount ?? 0} items
                </span>
                <button
                  type="button"
                  onClick={() => startEditing(category)}
                  aria-label="Rename"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-coffee-500 hover:bg-gold-100 hover:text-gold-700 dark:text-cream-300 dark:hover:bg-coffee-800"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category)}
                  aria-label="Delete"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-coffee-500 hover:bg-crimson-100 hover:text-crimson-600 dark:text-cream-300 dark:hover:bg-coffee-800"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {isAdding ? (
            <form
              onSubmit={handleCreate}
              className="mt-3 rounded-xl border-2 border-dashed border-clay-400 bg-clay-50/60 p-3 dark:bg-coffee-900/40"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-coffee-800 dark:text-cream-100">
                  New Category
                </p>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-coffee-500 hover:text-coffee-800 dark:text-cream-300"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                required
                placeholder="Category name (e.g. Smoothie, ភេសជ្ជៈត្រជាក់)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-coffee-300 px-3 py-1.5 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <input
                placeholder="Icon hint (optional, e.g. coffee, tea, cake)"
                value={form.iconKey}
                onChange={(e) => setForm({ ...form, iconKey: e.target.value })}
                className="mt-2 w-full rounded-lg border border-coffee-300 px-3 py-1.5 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <input
                placeholder="Icon image path/URL (optional override)"
                value={form.iconUrl}
                onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
                className="mt-2 w-full rounded-lg border border-coffee-300 px-3 py-1.5 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="mt-2 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Add Category"}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-coffee-300 py-2 text-xs font-bold text-coffee-500 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-300 dark:hover:bg-coffee-800"
            >
              <Plus size={14} />
              Add Category
            </button>
          )}
        </div>
      )}
    </div>
  );
}
