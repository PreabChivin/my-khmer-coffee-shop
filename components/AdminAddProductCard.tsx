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
  descriptionEn: "",
  descriptionKh: "",
  price: "",
  category: CATEGORIES[0],
  image: "/images/espresso.jpg",
  isPartner: false,
  partnerName: "",
  discountPercent: "",
};

/** 👑 "➕ Add a new cute drink" — sits at the front of the homepage grid,
 *  only rendered for a logged-in admin in Editing Mode. */
export default function AdminAddProductCard({
  onCreated,
}: {
  onCreated: (created: ProductDTO) => void;
}) {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: form.nameEn,
          nameKh: form.nameKh,
          descriptionEn: form.descriptionEn || null,
          descriptionKh: form.descriptionKh || null,
          price: parseFloat(form.price),
          category: form.category,
          image: form.image,
          isPartner: form.isPartner,
          partnerName: form.isPartner ? form.partnerName || null : null,
          discountPercent: Number(form.discountPercent) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      onCreated(data);
      setForm(EMPTY_FORM);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed border-clay-400 bg-clay-50/60 text-clay-600 transition-transform hover:scale-[1.02] active:scale-95 dark:bg-coffee-900/40 dark:text-clay-400"
      >
        <span className="animate-bounce-cute flex h-14 w-14 items-center justify-center rounded-full bg-clay-400 text-white">
          <Plus size={26} />
        </span>
        <span className="px-4 text-center font-heading text-sm font-extrabold">
          {t("admin.addNewProduct")}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
          <div className="khmer-card relative w-full max-w-sm rounded-3xl bg-cream-50 p-6 dark:bg-coffee-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg text-coffee-900 dark:text-cream-50">
                {t("admin.addNewProduct")}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-coffee-500 hover:text-coffee-800 dark:text-cream-300 dark:hover:text-cream-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder={t("adminMenu.nameEn")}
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
                <input
                  required
                  placeholder={t("adminMenu.nameKh")}
                  value={form.nameKh}
                  onChange={(e) => setForm({ ...form, nameKh: e.target.value })}
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 font-khmer text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
              </div>
              <textarea
                placeholder={t("adminMenu.descEn")}
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <textarea
                placeholder={t("adminMenu.descKh")}
                value={form.descriptionKh}
                onChange={(e) => setForm({ ...form, descriptionKh: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 font-khmer text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <div className="flex gap-3">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={t("adminMenu.price")}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
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
                className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />

              <div className="rounded-xl border-2 border-dashed border-crimson-400 bg-crimson-50/60 px-3 py-2.5 dark:bg-coffee-900/40">
                <label className="mb-1 block text-sm font-semibold text-coffee-800 dark:text-cream-100">
                  🔥 ភាគរយបញ្ចុះតម្លៃ (%) / Discount Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
                {Number(form.discountPercent) > 0 && !Number.isNaN(parseFloat(form.price)) && (
                  <p className="mt-2 text-xs font-semibold text-crimson-600 dark:text-crimson-400">
                    <span className="line-through opacity-60">
                      ${parseFloat(form.price || "0").toFixed(2)}
                    </span>{" "}
                    → $
                    {computeDiscountedPrice(
                      parseFloat(form.price || "0"),
                      Number(form.discountPercent)
                    ).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="rounded-xl border-2 border-dashed border-matcha-400 bg-matcha-50 px-3 py-2.5 dark:bg-coffee-900/40">
                <label className="flex items-center gap-2 text-sm font-semibold text-coffee-800 dark:text-cream-100">
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
                    className="mt-2 w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                  />
                )}
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              >
                {isSaving ? t("adminMenu.saving") : t("adminMenu.save")}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
