"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import AdminEditPopover from "@/components/admin/AdminEditPopover";
import ProductImage from "@/components/ProductImage";
import { clampDiscountPercent, computeDiscountedPrice } from "@/lib/pricing";
import { localizedCategory } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CategoryDTO, ProductDTO } from "@/lib/types";

function isValidPrice(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

export default function ProductRow({
  product,
  categories,
  onProductUpdated,
  onProductDeleted,
  onError,
}: {
  product: ProductDTO;
  categories: CategoryDTO[];
  onProductUpdated: (updated: ProductDTO) => void;
  onProductDeleted: (id: string) => void;
  onError: (message: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [localProduct, setLocalProduct] = useState(product);
  const [nameKhDraft, setNameKhDraft] = useState(product.nameKh);
  const [priceDraft, setPriceDraft] = useState(String(product.price));
  const [discountDraft, setDiscountDraft] = useState(String(product.discountPercent || ""));
  const [showEditPopover, setShowEditPopover] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isTogglingStock, setIsTogglingStock] = useState(false);

  useEffect(() => {
    // Re-syncs local drafts whenever the parent passes a fresh product
    // (e.g. after another field commits and the server echoes it back).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalProduct(product);
    setNameKhDraft(product.nameKh);
    setPriceDraft(String(product.price));
    setDiscountDraft(String(product.discountPercent || ""));
  }, [product]);

  if (isDeleted) return null;

  // ⚡ Optimistic PATCH: mutate local state immediately, resolve with the
  // server in the background, roll back + toast only if it actually fails.
  async function commit(patch: Record<string, unknown>, rollback: () => void) {
    const res = await fetch(`/api/admin/products/${localProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);

    if (!res || !res.ok) {
      rollback();
      const data = await res?.json().catch(() => null);
      onError(data?.error ?? "Couldn't save that change — please try again.");
      return;
    }
    const updated: ProductDTO = await res.json();
    setLocalProduct(updated);
    onProductUpdated(updated);
  }

  function handleNameBlur() {
    const trimmed = nameKhDraft.trim();
    if (!trimmed) {
      setNameKhDraft(localProduct.nameKh);
      onError("Product name cannot be empty.");
      return;
    }
    if (trimmed === localProduct.nameKh) return;
    const previous = localProduct.nameKh;
    setLocalProduct((p) => ({ ...p, nameKh: trimmed }));
    void commit({ nameKh: trimmed }, () => {
      setLocalProduct((p) => ({ ...p, nameKh: previous }));
      setNameKhDraft(previous);
    });
  }

  function handlePriceBlur() {
    const parsed = Number(priceDraft);
    if (!isValidPrice(parsed)) {
      setPriceDraft(String(localProduct.price));
      onError("Price must be a positive number.");
      return;
    }
    const rounded = Math.round(parsed * 100) / 100;
    if (rounded === localProduct.price) {
      setPriceDraft(String(rounded));
      return;
    }
    const previous = localProduct.price;
    setLocalProduct((p) => ({ ...p, price: rounded }));
    setPriceDraft(String(rounded));
    void commit({ price: rounded }, () => {
      setLocalProduct((p) => ({ ...p, price: previous }));
      setPriceDraft(String(previous));
    });
  }

  function handleDiscountBlur() {
    const raw = discountDraft.trim();
    if (raw !== "" && !Number.isFinite(Number(raw))) {
      setDiscountDraft(String(localProduct.discountPercent || ""));
      onError("Discount must be a number between 0 and 100.");
      return;
    }
    const clamped = clampDiscountPercent(raw === "" ? 0 : Number(raw));
    if (clamped === localProduct.discountPercent) {
      setDiscountDraft(String(clamped || ""));
      return;
    }
    const previous = localProduct.discountPercent;
    setLocalProduct((p) => ({ ...p, discountPercent: clamped }));
    setDiscountDraft(String(clamped || ""));
    void commit({ discountPercent: clamped }, () => {
      setLocalProduct((p) => ({ ...p, discountPercent: previous }));
      setDiscountDraft(String(previous || ""));
    });
  }

  async function handleToggleStock() {
    const previous = localProduct.isAvailable;
    setLocalProduct((p) => ({ ...p, isAvailable: !previous }));
    setIsTogglingStock(true);
    try {
      await commit({ isAvailable: !previous }, () => {
        setLocalProduct((p) => ({ ...p, isAvailable: previous }));
      });
    } finally {
      setIsTogglingStock(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `${t("adminMenu.deleteConfirmPrefix")} "${localProduct.nameKh}"${t("adminMenu.deleteConfirmSuffix")}`
      )
    ) {
      return;
    }
    setIsDeleted(true);
    const res = await fetch(`/api/admin/products/${localProduct.id}`, {
      method: "DELETE",
    }).catch(() => null);
    if (!res || !res.ok) {
      setIsDeleted(false);
      const data = await res?.json().catch(() => null);
      onError(data?.error ?? "Couldn't delete that product — please try again.");
      return;
    }
    onProductDeleted(localProduct.id);
  }

  const hasDiscount = localProduct.discountPercent > 0;
  const discountedPrice = computeDiscountedPrice(
    localProduct.price,
    localProduct.discountPercent
  );

  return (
    <div className="grid grid-cols-[auto_1fr_5.5rem_4.5rem_auto_auto] items-center gap-2 rounded-xl border border-coffee-200 bg-cream-50 p-2 dark:border-coffee-700 dark:bg-coffee-900">
      <ProductImage
        src={localProduct.image}
        alt={localProduct.nameKh}
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
      />

      <div className="min-w-0">
        <input
          value={nameKhDraft}
          onChange={(e) => setNameKhDraft(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-full truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 font-khmer text-sm font-semibold text-coffee-900 outline-none hover:border-coffee-200 focus:border-gold-500 focus:bg-white dark:text-cream-50 dark:hover:border-coffee-600 dark:focus:bg-coffee-800"
        />
        <p className="truncate px-1 text-[10px] text-coffee-400 dark:text-cream-400">
          {localizedCategory(localProduct.category, lang)}
          {localProduct.isPartner && (
            <span className="ml-1 font-bold text-matcha-600 dark:text-matcha-400">
              🤝 {localProduct.partnerName ?? t("product.partnerBadge")}
            </span>
          )}
          {hasDiscount && (
            <span className="ml-1 font-bold text-crimson-500">
              → ${discountedPrice.toFixed(2)}
            </span>
          )}
        </p>
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] text-coffee-400">
          $
        </span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={priceDraft}
          onChange={(e) => setPriceDraft(e.target.value)}
          onBlur={handlePriceBlur}
          onWheel={(e) => e.currentTarget.blur()}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-full rounded-md border border-coffee-200 bg-white py-1 pl-4 pr-1 text-right text-xs font-semibold text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-800 dark:text-cream-50"
        />
      </div>

      <div className="relative">
        <input
          type="number"
          min="0"
          max="100"
          placeholder="0"
          value={discountDraft}
          onChange={(e) => setDiscountDraft(e.target.value)}
          onBlur={handleDiscountBlur}
          onWheel={(e) => e.currentTarget.blur()}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-full rounded-md border border-coffee-200 bg-white py-1 pl-1 pr-4 text-right text-xs font-semibold text-crimson-600 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-800 dark:text-crimson-400"
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] text-coffee-400">
          %
        </span>
      </div>

      {/* 📦 High-contrast stock toggle switch */}
      <button
        type="button"
        onClick={handleToggleStock}
        disabled={isTogglingStock}
        aria-pressed={localProduct.isAvailable}
        aria-label={t("adminMenu.availableToggle")}
        className={`relative flex h-7 w-14 shrink-0 items-center rounded-full px-1 shadow-inner transition-colors disabled:opacity-60 ${
          localProduct.isAvailable ? "bg-matcha-500" : "bg-crimson-500"
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] shadow transition-transform ${
            localProduct.isAvailable ? "translate-x-7" : "translate-x-0"
          }`}
        >
          📦
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setShowEditPopover(true)}
          aria-label={t("adminMenu.editProduct")}
          className="flex h-7 w-7 items-center justify-center rounded-full text-coffee-500 transition-colors hover:bg-gold-100 hover:text-gold-700 dark:text-cream-300 dark:hover:bg-coffee-800"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={t("adminMenu.deleteConfirmPrefix")}
          className="flex h-7 w-7 items-center justify-center rounded-full text-coffee-500 transition-colors hover:bg-crimson-100 hover:text-crimson-600 dark:text-cream-300 dark:hover:bg-coffee-800"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {showEditPopover && (
        <AdminEditPopover
          product={localProduct}
          categories={categories}
          onSaved={(updated) => {
            setLocalProduct(updated);
            onProductUpdated(updated);
            setShowEditPopover(false);
          }}
          onClose={() => setShowEditPopover(false)}
        />
      )}
    </div>
  );
}
