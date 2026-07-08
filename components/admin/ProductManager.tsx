"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedCategory, localizedName } from "@/lib/i18n";
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
  isAvailable: true,
};

export default function ProductManager() {
  const { lang, t } = useLanguage();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function fetchProducts() {
    const res = await fetch("/api/admin/products");
    if (res.ok) setProducts(await res.json());
    setIsLoading(false);
  }

  useEffect(() => {
    // Standard fetch-on-mount: loads the admin's product list from the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(product: ProductDTO) {
    setEditingId(product.id);
    setForm({
      nameEn: product.nameEn,
      nameKh: product.nameKh,
      descriptionEn: product.descriptionEn ?? "",
      descriptionKh: product.descriptionKh ?? "",
      price: String(product.price),
      category: product.category,
      image: product.image,
      isAvailable: product.isAvailable,
    });
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const payload = {
      nameEn: form.nameEn,
      nameKh: form.nameKh,
      descriptionEn: form.descriptionEn || null,
      descriptionKh: form.descriptionKh || null,
      price: parseFloat(form.price),
      category: form.category,
      image: form.image,
      isAvailable: form.isAvailable,
    };

    try {
      const res = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save product");

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleAvailability(product: ProductDTO) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !product.isAvailable }),
    });
    fetchProducts();
  }

  async function handleDelete(product: ProductDTO) {
    const name = localizedName(product, lang);
    if (
      !confirm(
        `${t("adminMenu.deleteConfirmPrefix")} "${name}"${t(
          "adminMenu.deleteConfirmSuffix"
        )}`
      )
    )
      return;
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Failed to delete product");
      return;
    }
    fetchProducts();
  }

  if (isLoading) {
    return (
      <p className="p-6 text-coffee-500 dark:text-cream-300">
        {t("adminMenu.loading")}
      </p>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl text-coffee-900 dark:text-cream-50">
          {t("adminMenu.title")}
        </h2>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-coffee-900 hover:bg-gold-600"
        >
          <Plus size={16} /> {t("adminMenu.addProduct")}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-coffee-200 bg-cream-50 dark:border-coffee-700 dark:bg-coffee-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-coffee-100 text-coffee-700 dark:bg-coffee-900 dark:text-cream-200">
            <tr>
              <th className="px-4 py-3">{t("adminMenu.item")}</th>
              <th className="px-4 py-3">{t("adminMenu.category")}</th>
              <th className="px-4 py-3">{t("adminMenu.price")}</th>
              <th className="px-4 py-3">{t("adminMenu.status")}</th>
              <th className="px-4 py-3 text-right">{t("adminMenu.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const name = localizedName(product, lang);
              return (
                <tr
                  key={product.id}
                  className="border-t border-coffee-100 dark:border-coffee-700"
                >
                  <td className="flex items-center gap-3 px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-coffee-900 dark:text-cream-50">
                        {name}
                      </p>
                      <p className="max-w-xs truncate text-xs text-coffee-500 dark:text-cream-300">
                        {product.nameEn} · {product.nameKh}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-coffee-600 dark:text-cream-300">
                    {localizedCategory(product.category, lang)}
                  </td>
                  <td className="px-4 py-3 font-medium text-coffee-900 dark:text-cream-50">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleAvailability(product)}
                      aria-pressed={product.isAvailable}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                          product.isAvailable ? "bg-matcha-400" : "bg-coffee-300 dark:bg-coffee-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            product.isAvailable ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          product.isAvailable
                            ? "text-matcha-700 dark:text-matcha-400"
                            : "text-coffee-500 dark:text-cream-300"
                        }`}
                      >
                        {product.isAvailable
                          ? t("adminMenu.available")
                          : t("adminMenu.outOfStock")}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        aria-label={`Edit ${name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-coffee-600 hover:bg-coffee-100 dark:text-cream-300 dark:hover:bg-coffee-700"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        aria-label={`Delete ${name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-coffee-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-cream-50 p-6 shadow-2xl dark:bg-coffee-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg text-coffee-900 dark:text-cream-50">
                {editingId
                  ? t("adminMenu.editProduct")
                  : t("adminMenu.addProduct")}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
                <input
                  required
                  placeholder={t("adminMenu.nameKh")}
                  value={form.nameKh}
                  onChange={(e) => setForm({ ...form, nameKh: e.target.value })}
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 font-khmer text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
              </div>
              <textarea
                placeholder={t("adminMenu.descEn")}
                value={form.descriptionEn}
                onChange={(e) =>
                  setForm({ ...form, descriptionEn: e.target.value })
                }
                rows={2}
                className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <textarea
                placeholder={t("adminMenu.descKh")}
                value={form.descriptionKh}
                onChange={(e) =>
                  setForm({ ...form, descriptionKh: e.target.value })
                }
                rows={2}
                className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 font-khmer text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <div className="flex gap-3">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={t("adminMenu.price")}
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {localizedCategory(category, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <input
                required
                placeholder={t("adminMenu.imagePath")}
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full rounded-xl border border-coffee-300 px-4 py-2.5 text-coffee-900 outline-none focus:border-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
              <label className="flex items-center gap-2 text-sm text-coffee-700 dark:text-cream-200">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) =>
                    setForm({ ...form, isAvailable: e.target.checked })
                  }
                />
                {t("adminMenu.availableToggle")}
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl bg-gold-500 py-2.5 font-semibold text-coffee-900 hover:bg-gold-600 disabled:opacity-60"
              >
                {isSaving ? t("adminMenu.saving") : t("adminMenu.save")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
