"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import AddProductInline from "@/components/admin/AddProductInline";
import ProductRow from "@/components/admin/ProductRow";
import CategoryManager from "@/components/admin/CategoryManager";
import type { CategoryDTO, ProductDTO } from "@/lib/types";

/** 🧋 RIGHT PANEL — "តំបន់គ្រប់គ្រងហាងសកល (Dynamic Menu & Partner CMS)".
 *  Category Manager up top, quick-add form next, dense inline-editable
 *  product table below. */
export default function ProductManagementPanel({
  products,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
  onError,
}: {
  products: ProductDTO[];
  onProductCreated: (created: ProductDTO) => void;
  onProductUpdated: (updated: ProductDTO) => void;
  onProductDeleted: (id: string) => void;
  onError: (message: string) => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  // 🍩 Categories fetched once here and threaded down to every child that
  // needs them (Category Manager itself, the quick-add form, and each
  // product row's full-edit popover) so there's a single source of truth
  // and no redundant fetches.
  const [categories, setCategories] = useState<CategoryDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: CategoryDTO[]) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) onError("Couldn't load categories — the database may be busy.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCategoryCreated(created: CategoryDTO) {
    setCategories((prev) => [...prev, created]);
  }
  function handleCategoryUpdated(updated: CategoryDTO) {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }
  function handleCategoryDeleted(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  const visibleProducts = useMemo(() => {
    if (!normalizedQuery) return products;
    return products.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(normalizedQuery) ||
        p.nameKh.toLowerCase().includes(normalizedQuery)
    );
  }, [products, normalizedQuery]);

  return (
    <div className="khmer-card rounded-2xl bg-cream-50/60 p-4 dark:bg-coffee-800/40">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          តំបន់គ្រប់គ្រងហាងសកល 🧋
        </h2>
        <span className="rounded-full bg-coffee-100 px-2.5 py-1 text-xs font-bold text-coffee-600 dark:bg-coffee-900 dark:text-cream-200">
          {products.length} items
        </span>
      </div>

      <CategoryManager
        categories={categories}
        onCategoryCreated={handleCategoryCreated}
        onCategoryUpdated={handleCategoryUpdated}
        onCategoryDeleted={handleCategoryDeleted}
        onError={onError}
      />

      <div className="mb-3">
        <AddProductInline
          categories={categories}
          onCreated={onProductCreated}
          onError={onError}
        />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("menu.searchPlaceholder")}
        className="mb-2 w-full rounded-xl border border-coffee-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
      />

      <div className="flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto pr-0.5">
        {visibleProducts.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-coffee-400 dark:text-cream-400">
            {t("menu.noResults")}
          </p>
        )}
        {visibleProducts.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            categories={categories}
            onProductUpdated={onProductUpdated}
            onProductDeleted={onProductDeleted}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
}
