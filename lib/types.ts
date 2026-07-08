export interface ProductDTO {
  id: string;
  nameEn: string;
  nameKh: string;
  descriptionEn: string | null;
  descriptionKh: string | null;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
}

export type OrderType = "PickUp" | "Delivery";

export type OrderStatus =
  | "PENDING"
  | "AWAITING_VERIFICATION"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "FAILED";

/** Ice level for customizable drinks (Starbucks-style modifiers). */
export type IceLevel = "none" | "less" | "normal" | "extra";

/**
 * Per-line drink customization captured before an item is added to the cart.
 * Persisted as a nullable JSONB column on OrderItem — always null for
 * non-customizable items (e.g. bakery).
 */
export interface DrinkCustomization {
  /** Sweetness percentage: 0 | 25 | 50 | 100 (natural palm sugar). */
  sweetness: number;
  ice: IceLevel;
  /** Extra espresso shots (0–3); each adds a server-authoritative surcharge. */
  shots: number;
}

export interface CartItem {
  /** Unique per customized line — two identical products with different
   *  customizations are distinct cart lines. */
  lineId: string;
  productId: string;
  nameEn: string;
  nameKh: string;
  /** Unit price INCLUDING customization surcharge. */
  price: number;
  /** Product base price, before customization surcharge. */
  basePrice: number;
  image: string;
  quantity: number;
  category: string;
  customization: DrinkCustomization | null;
}

export interface CheckoutRequestItem {
  productId: string;
  quantity: number;
  customization?: DrinkCustomization | null;
  /** 👯 Bestie Cart: whose drink this is, e.g. "Bong Vitou". */
  contributorName?: string | null;
}

export interface CheckoutRequestBody {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  address?: string;
  note?: string;
  /** "Destiny Cup" fortune revealed to the customer, stored with the order. */
  fortune?: string | null;
  /** 🐻 Index into `items` whose single unit should be redeemed free. */
  redeemFreeDrinkIndex?: number | null;
  /** 💖 Gift a Drink */
  isGift?: boolean;
  giftRecipientName?: string;
  giftMessage?: string;
  /** 👯 Present when checking out a shared Bestie Cart. */
  groupCartId?: string | null;
  items: CheckoutRequestItem[];
}

export interface CheckoutResponseBody {
  orderId: string;
  totalAmount: number;
  isGift: boolean;
}

export interface OrderStatusResponseBody {
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus | null;
}

/** 🐻 Cute Bear Stamps loyalty status for a phone number. */
export interface LoyaltyStatusResponseBody {
  phone: string;
  stampCount: number;
  stampsTowardNext: number;
  availableFreeDrinks: number;
}

/** 👯 A single drink inside a shared Bestie Cart. */
export interface GroupCartItemDTO {
  id: string;
  contributorName: string;
  productId: string;
  quantity: number;
  customization: DrinkCustomization | null;
  product: {
    nameEn: string;
    nameKh: string;
    price: number;
    image: string;
    category: string;
  };
}

export interface GroupCartStateDTO {
  id: string;
  status: "OPEN" | "CHECKED_OUT";
  orderId: string | null;
  items: GroupCartItemDTO[];
}

/** 💖 Public gift voucher shown at /gift/[orderId]. */
export interface GiftVoucherDTO {
  orderId: string;
  shortCode: string;
  fromName: string;
  toName: string;
  message: string | null;
  redeemed: boolean;
  items: { nameEn: string; nameKh: string; quantity: number }[];
}
