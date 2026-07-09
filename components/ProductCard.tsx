"use client";

import { useEffect, useState } from "react";
import { Package, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedDescription, localizedName } from "@/lib/i18n";
import { isCustomizable } from "@/lib/customization";
import DrinkCustomizer from "@/components/DrinkCustomizer";
import GroupNamePromptModal from "@/components/GroupNamePromptModal";
import AdminEditPopover from "@/components/AdminEditPopover";
import ApsaraChibi from "@/components/mascots/ApsaraChibi";
import { playPop } from "@/lib/sfx";
import type { DrinkCustomization, ProductDTO } from "@/lib/types";

// Playful Gen-Z slang tags sprinkled onto menu cards. Picked deterministically
// per product (by id) so the server and client always render the same one — no
// hydration mismatch.
const SLANGS: { km: string; en: string }[] = [
  { km: "ពេញចិត្តស្តូក ⭐", en: "total fave ⭐" },
  { km: "ឆ្ងាញ់ម៉ៅដាច់ 🔥", en: "slaps hard 🔥" },
  { km: "ប្រូ/ស៊ីស ត្រូវសាក 💖", en: "bestie must-try 💖" },
];

function slangFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return SLANGS[sum % SLANGS.length];
}

interface ProductCardProps {
  product: ProductDTO;
  /** Lets a parent list (e.g. the homepage grid) stay in sync with edits. */
  onProductUpdated?: (updated: ProductDTO) => void;
  onProductDeleted?: (id: string) => void;
}

export default function ProductCard({
  product,
  onProductUpdated,
  onProductDeleted,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isGroupMode, contributorName, setContributorName, addGroupItem } =
    useGroupCart();
  const { isEditingMode } = useAdminSession();
  const { lang, t } = useLanguage();
  const [justAdded, setJustAdded] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showEditPopover, setShowEditPopover] = useState(false);
  const [pendingCustomization, setPendingCustomization] = useState<
    DrinkCustomization | null | undefined
  >(undefined);

  // Local optimistic copy so admin edits/deletes reflect on this exact card
  // immediately, regardless of whether the parent list also stays in sync.
  const [localProduct, setLocalProduct] = useState(product);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isTogglingStock, setIsTogglingStock] = useState(false);
  useEffect(() => {
    // Deferred to an effect: re-syncs this card's local optimistic copy
    // whenever the parent passes a fresh product (e.g. after a data refetch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalProduct(product);
  }, [product]);

  const name = localizedName(localProduct, lang);
  const description = localizedDescription(localProduct, lang);
  const customizable = isCustomizable(localProduct.category);
  const slang = slangFor(localProduct.id);

  if (isDeleted) return null;

  function flashAdded() {
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  async function commitAdd(customization: DrinkCustomization | null) {
    if (isGroupMode) {
      if (!contributorName.trim()) {
        setPendingCustomization(customization);
        setShowNamePrompt(true);
        return;
      }
      const ok = await addGroupItem(localProduct, 1, customization);
      if (ok) flashAdded();
      return;
    }
    addItem(localProduct, customization ? { customization } : undefined);
    flashAdded();
  }

  function handleAdd() {
    if (customizable) {
      setShowCustomizer(true);
      return;
    }
    playPop();
    void commitAdd(null);
  }

  function handleConfirmCustomization(customization: DrinkCustomization) {
    setShowCustomizer(false);
    void commitAdd(customization);
  }

  function handleNameConfirmed(confirmedName: string) {
    setContributorName(confirmedName);
    setShowNamePrompt(false);
    void commitAdd(pendingCustomization ?? null);
    setPendingCustomization(undefined);
  }

  function handleSaved(updated: ProductDTO) {
    setLocalProduct(updated);
    setShowEditPopover(false);
    onProductUpdated?.(updated);
  }

  async function handleToggleStock() {
    setIsTogglingStock(true);
    try {
      const res = await fetch(`/api/admin/products/${localProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !localProduct.isAvailable }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLocalProduct(updated);
        onProductUpdated?.(updated);
      }
    } finally {
      setIsTogglingStock(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`${t("adminMenu.deleteConfirmPrefix")} "${name}"${t("adminMenu.deleteConfirmSuffix")}`)) {
      return;
    }
    const res = await fetch(`/api/admin/products/${localProduct.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setIsDeleted(true);
      onProductDeleted?.(localProduct.id);
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete");
    }
  }

  return (
    <div className="khmer-card card-neon group relative flex flex-col overflow-hidden rounded-3xl bg-cream-50 dark:bg-coffee-800">
      {/* 👶✨ Baby Apsara dances when an item is added */}
      {justAdded && (
        <div className="pointer-events-none absolute left-1/2 top-1/3 z-20 -translate-x-1/2">
          <ApsaraChibi hearts size={96} className="animate-apsara-dance" />
        </div>
      )}
      <div className="relative aspect-square w-full overflow-hidden bg-coffee-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={localProduct.image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* 💖 Playful slang badge */}
        {localProduct.isAvailable && (
          <span className="absolute left-2 top-2 rounded-full bg-clay-400/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {lang === "km" ? slang.km : slang.en}
          </span>
        )}
        {/* 🤝 Partner Integration badge */}
        {localProduct.isPartner && (
          <span className="absolute right-2 top-2 rounded-full bg-matcha-500/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {localProduct.partnerName
              ? `🤝 ${localProduct.partnerName}`
              : t("product.partnerBadge")}
          </span>
        )}
        {!localProduct.isAvailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-clay-400/70 backdrop-blur-[2px]">
            <span className="text-3xl">🧸</span>
            <span className="rounded-full bg-white px-4 py-1.5 text-center text-xs font-bold text-clay-600 shadow-sm">
              {t("menu.outOfStock")}
            </span>
          </div>
        )}

        {/* 🔐 Admin Editing Mode overlay controls */}
        {isEditingMode && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-coffee-900/60 py-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setShowEditPopover(true)}
              aria-label={t("admin.editItem")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-coffee-900 shadow transition-transform hover:scale-110 active:scale-95"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={handleToggleStock}
              disabled={isTogglingStock}
              aria-label={t("admin.toggleStock")}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow transition-transform hover:scale-110 active:scale-95 disabled:opacity-60 ${
                localProduct.isAvailable ? "bg-matcha-500" : "bg-coffee-400"
              }`}
            >
              <Package size={14} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              aria-label={t("admin.deleteItem")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-crimson-500 text-white shadow transition-transform hover:scale-110 active:scale-95"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col p-4">
        <div className="relative flex items-start justify-between gap-2">
          <h3 className="font-heading text-base text-coffee-900 dark:text-cream-50">
            {name}
          </h3>
          <span className="whitespace-nowrap font-semibold text-clay-500 dark:text-clay-400">
            ${localProduct.price.toFixed(2)}
          </span>
        </div>
        {description && (
          <p className="relative mt-1 flex-1 text-sm text-coffee-500 dark:text-cream-300">
            {description}
          </p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!localProduct.isAvailable}
          className="relative mt-4 flex items-center justify-center gap-2 rounded-full bg-gold-500 py-2.5 text-sm font-bold text-coffee-900 shadow-sm transition-transform hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-gold-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-coffee-200 disabled:text-coffee-400 disabled:hover:translate-y-0 disabled:hover:scale-100"
        >
          {customizable ? <SlidersHorizontal size={16} /> : <Plus size={16} />}
          {justAdded ? t("menu.added") : t("menu.addToCart")}
        </button>
      </div>

      {showCustomizer && (
        <DrinkCustomizer
          product={localProduct}
          onConfirm={handleConfirmCustomization}
          onClose={() => setShowCustomizer(false)}
        />
      )}

      {showNamePrompt && (
        <GroupNamePromptModal
          onConfirm={handleNameConfirmed}
          onClose={() => {
            setShowNamePrompt(false);
            setPendingCustomization(undefined);
          }}
        />
      )}

      {showEditPopover && (
        <AdminEditPopover
          product={localProduct}
          onSaved={handleSaved}
          onClose={() => setShowEditPopover(false)}
        />
      )}
    </div>
  );
}
