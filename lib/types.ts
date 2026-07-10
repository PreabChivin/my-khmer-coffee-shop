export interface ProductDTO {
  id: string;
  nameEn: string;
  nameKh: string;
  descriptionEn: string | null;
  descriptionKh: string | null;
  price: number;
  /** Resolved Category.name — kept as a plain string for backward
   *  compatibility with display + customization-eligibility logic. */
  category: string;
  /** 🍩 Category Menu: the real foreign key, used for filtering. */
  categoryId: string;
  image: string;
  isAvailable: boolean;
  /** 🤝 Partner Integration: co-branded / partner-exclusive items. */
  isPartner: boolean;
  partnerName: string | null;
  /** 🔥 Multi-tier Discount System. */
  discountPercent: number; // % off (0 = none)
  flatDiscount: number; // $ off, applied after the % (0 = none)
  promoTag: string | null; // cosmetic conditional badge, e.g. "ទិញ 1 ថែម 1"
  /** ⭐ Rating aggregate — compute average with computeAverageRating(). */
  ratingCount: number;
  ratingSum: number;
}

/** 👤 Public-safe customer account shape (never includes passwordHash). */
export interface UserDTO {
  id: string;
  email: string;
  username: string | null;
  name: string;
  phone: string | null;
  loyaltyPoints: number;
  /** ISO date string, or null if not on file. Generation is derived from it. */
  dateOfBirth: string | null;
}

/** 👑 One row in the admin "Registered Customers" table. */
export interface AdminCustomerRowDTO {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  loyaltyPoints: number;
  joinedAt: string;
  orderCount: number;
}

/** 🧾 One row in a customer's / admin's order-history view. */
export interface OrderHistoryItemDTO {
  id: string;
  createdAt: string;
  /** Last change timestamp — drives the header "unread since last seen" badge. */
  updatedAt: string;
  orderStatus: OrderStatus;
  orderType: OrderType;
  totalAmount: number;
  paymentStatus: PaymentStatus | null;
  paymentMethod: string | null;
  pointsAwarded: boolean;
  items: { nameEn: string; nameKh: string; quantity: number; price: number }[];
}

/** 👑 Admin per-customer profile: the account + lifetime value + history. */
export interface CustomerProfileDTO {
  user: UserDTO;
  lifetimeValue: number;
  orderCount: number;
  orders: OrderHistoryItemDTO[];
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
  /** 🧋 Boba pearls topping — adds a server-authoritative surcharge. */
  boba: boolean;
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
  /** 🎡 Wheel of Coffee prize label won at checkout. */
  spinPrize?: string | null;
  /** 🐻 Index into `items` whose single unit should be redeemed free. */
  redeemFreeDrinkIndex?: number | null;
  /** 💖 Gift a Drink */
  isGift?: boolean;
  giftRecipientName?: string;
  giftMessage?: string;
  /** 👯 Present when checking out a shared Bestie Cart. */
  groupCartId?: string | null;
  /** 🔔 This device's Telegram session token (localStorage) — when the
   *  customer connected via the header button, links this order's chat. */
  telegramSessionToken?: string | null;
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
  /** ⭐ Null until the customer rates this order (also the "already rated" guard). */
  customerRating: number | null;
  /** 🔔 True once the customer has linked their Telegram chat via the deep-link button. */
  telegramLinked: boolean;
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

/** 🍩 Category Menu — a homepage/menu category, resolvable to an icon via
 *  lib/iconResolver.ts. productCount is only present on the admin CRUD list
 *  response (used to warn before a cascading delete). */
export interface CategoryDTO {
  id: string;
  name: string;
  iconKey: string | null;
  iconUrl: string | null;
  productCount?: number;
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
