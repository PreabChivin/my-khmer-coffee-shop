"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedCategory } from "@/lib/i18n";
import { computeDiscountedPrice } from "@/lib/pricing";
import type { ProductDTO } from "@/lib/types";

const CATEGORIES = ["Coffee", "Tea", "Bakery"];

const EMPTY_FORM = {
  nameEn: "",
  nameKh: "",
  price: "",
  category: CATEGORIES[0],
  image: "/images/espresso.jpg",
  discountPercent: "",
  isPartner: false,
  partnerName: "",
};

function isValidPrice(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

/** ➕ Collapsible quick-add form pinned to the top of the Menu & Partner CMS
 *  panel — expands inline (no modal) so staff can rattle off several new
 *  items back to back without an overlay interrupting the workspace. */
export default function AddProductInline({
  onCreated,
  onError,
}: {
  onCreated: (created: ProductDTO) => void;
  onError: (message: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);

    const price = parseFloat(form.price);
    if (!form.nameEn.trim() || !form.nameKh.trim()) {
      setFieldError("Please fill in both the English and Khmer names.");
      return;
    }
    if (!isValidPrice(price)) {
      setFieldError("Price must be a positive number.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: form.nameEn,
          nameKh: form.nameKh,
          price,
          category: form.category,
          image: form.image,
          discountPercent: Number(form.discountPercent) || 0,
          isPartner: form.isPartner,
          partnerName: form.isPartner ? form.partnerName || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      onCreated(data);
      setForm(EMPTY_FORM);
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create";
      setFieldError(message);
      onError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-clay-400 bg-clay-50/60 py-3 text-sm font-extrabold text-clay-600 transition-transform hover:scale-[1.01] active:scale-95 dark:bg-coffee-900/40 dark:text-clay-400"
      >
        <Plus size={18} />
        {t("admin.addNewProduct")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="khmer-card rounded-2xl border-2 border-dashed border-clay-400 bg-clay-50/60 p-4 dark:bg-coffee-900/40"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-extrabold text-coffee-900 dark:text-cream-50">
          {t("admin.addNewProduct")}
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-coffee-500 hover:text-coffee-800 dark:text-cream-300 dark:hover:text-cream-50"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          required
          placeholder={t("adminMenu.nameEn")}
          value={form.nameEn}
          onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          className="w-full rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
        />
        <input
          required
          placeholder={t("adminMenu.nameKh")}
          value={form.nameKh}
          onChange={(e) => setForm({ ...form, nameKh: e.target.value })}
          className="w-full rounded-xl border border-coffee-300 px-3 py-2 font-khmer text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
        />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <input
          required
          type="number"
          step="0.01"
          min="0.01"
          placeholder={t("adminMenu.price")}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          onWheel={(e) => e.currentTarget.blur()}
          className="w-full rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
        />
        <input
          type="number"
          min="0"
          max="100"
          placeholder="% off"
          value={form.discountPercent}
          onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
          onWheel={(e) => e.currentTarget.blur()}
          className="w-full rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full rounded-xl border border-coffee-300 px-2 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {localizedCategory(c, lang)}
            </option>
          ))}
        </select>
      </div>

      <input
        required
        placeholder={t("adminMenu.imagePath")}
        value={form.image}
        onChange={(e) => setForm({ ...form, image: e.target.value })}
        className="mt-2 w-full rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
      />

      <div className="mt-2 rounded-xl border-2 border-dashed border-matcha-400 bg-matcha-50 px-3 py-2 dark:bg-coffee-900/40">
        <label className="flex items-center gap-2 text-xs font-semibold text-coffee-800 dark:text-cream-100">
          <input
            type="checkbox"
            checked={form.isPartner}
            onChange={(e) => setForm({ ...form, isPartner: e.target.checked })}
          />
          🤝 {t("adminMenu.isPartner")}
        </label>
        {form.isPartner && (
          <input
            placeholder={t("adminMenu.partnerNamePlaceholder")}
            value={form.partnerName}
            onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
            className="mt-2 w-full rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
          />
        )}
      </div>

      {Number(form.discountPercent) > 0 && isValidPrice(parseFloat(form.price || "0")) && (
        <p className="mt-2 text-xs font-semibold text-crimson-600 dark:text-crimson-400">
          <span className="line-through opacity-60">
            ${parseFloat(form.price || "0").toFixed(2)}
          </span>{" "}
          → ${computeDiscountedPrice(parseFloat(form.price || "0"), Number(form.discountPercent)).toFixed(2)}
        </p>
      )}

      {fieldError && (
        <p className="mt-2 rounded-lg bg-crimson-50 px-3 py-1.5 text-xs text-crimson-600 dark:bg-coffee-950">
          {fieldError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-3 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
      >
        {isSaving ? t("adminMenu.saving") : t("adminMenu.save")}
      </button>
    </form>
  );
}
