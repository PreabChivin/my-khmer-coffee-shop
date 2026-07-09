"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem, DrinkCustomization, ProductDTO } from "@/lib/types";
import {
  customizationKey,
  customizationSurcharge,
} from "@/lib/customization";
import { computeDiscountedPrice } from "@/lib/pricing";
import type { Fortune } from "@/lib/fortunes";

const STORAGE_KEY = "cafe-cart";

interface AddItemOptions {
  quantity?: number;
  customization?: DrinkCustomization | null;
}

interface CartContextValue {
  items: CartItem[];
  isCartOpen: boolean;
  totalItems: number;
  subtotal: number;
  /** 🔮 "Daily Vibe Check" fortune injected from the drink configurator. */
  vibe: Fortune | null;
  setVibe: (fortune: Fortune | null) => void;
  /** 🎡 Wheel of Coffee prize id won for this cart (one spin per cart). */
  spinPrize: string | null;
  setSpinPrize: (prizeId: string | null) => void;
  addItem: (product: ProductDTO, options?: AddItemOptions) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Composite identity so identical products with identical customization merge. */
function lineKey(productId: string, customization: DrinkCustomization | null) {
  return `${productId}:${customizationKey(customization)}`;
}

/**
 * Normalizes a persisted cart back into the current CartItem shape. Older carts
 * (pre-customization) lacked lineId/basePrice/category — we backfill those so a
 * returning customer's saved cart doesn't crash the new UI.
 */
function normalizeStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const items: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const it = entry as Record<string, unknown>;
    if (typeof it.productId !== "string") continue;
    const price = typeof it.price === "number" ? it.price : 0;
    const basePrice = typeof it.basePrice === "number" ? it.basePrice : price;
    const quantity =
      typeof it.quantity === "number" && it.quantity > 0
        ? Math.floor(it.quantity)
        : 1;
    items.push({
      lineId:
        typeof it.lineId === "string" ? it.lineId : crypto.randomUUID(),
      productId: it.productId,
      nameEn: typeof it.nameEn === "string" ? it.nameEn : "",
      nameKh: typeof it.nameKh === "string" ? it.nameKh : "",
      price,
      basePrice,
      image: typeof it.image === "string" ? it.image : "",
      quantity,
      category: typeof it.category === "string" ? it.category : "",
      customization:
        (it.customization as DrinkCustomization | null | undefined) ?? null,
    });
  }
  return items;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [vibe, setVibe] = useState<Fortune | null>(null);
  const [spinPrize, setSpinPrize] = useState<string | null>(null);

  useEffect(() => {
    // Deliberately deferred to an effect: localStorage is unavailable during
    // SSR, so reading it in the initializer would produce a hydration
    // mismatch. Render empty on first paint, then hydrate client-side.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setItems(normalizeStoredCart(JSON.parse(stored)));
    } catch {
      // ignore corrupted local storage
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hasHydrated]);

  const addItem = useCallback(
    (product: ProductDTO, options?: AddItemOptions) => {
      const quantity = options?.quantity ?? 1;
      const customization = options?.customization ?? null;
      // 🔥 Discount is applied here (base price the customer actually pays,
      // before customization add-ons) — server re-verifies at checkout.
      const discountedBase = computeDiscountedPrice(
        product.price,
        product.discountPercent
      );
      const unitPrice = round2(
        discountedBase + customizationSurcharge(customization)
      );
      const key = lineKey(product.id, customization);

      setItems((prev) => {
        const existing = prev.find(
          (item) => lineKey(item.productId, item.customization) === key
        );
        if (existing) {
          return prev.map((item) =>
            item.lineId === existing.lineId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [
          ...prev,
          {
            lineId: crypto.randomUUID(),
            productId: product.id,
            nameEn: product.nameEn,
            nameKh: product.nameKh,
            price: unitPrice,
            basePrice: discountedBase,
            image: product.image,
            quantity,
            category: product.category,
            customization,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.lineId !== lineId);
      }
      return prev.map((item) =>
        item.lineId === lineId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setVibe(null);
    setSpinPrize(null);
  }, []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    isCartOpen,
    totalItems,
    subtotal,
    vibe,
    setVibe,
    spinPrize,
    setSpinPrize,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
