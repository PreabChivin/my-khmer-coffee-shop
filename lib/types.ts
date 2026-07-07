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
}

export interface CheckoutRequestBody {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  address?: string;
  note?: string;
  /** "Destiny Cup" fortune revealed to the customer, stored with the order. */
  fortune?: string | null;
  items: CheckoutRequestItem[];
}

export interface CheckoutResponseBody {
  orderId: string;
  totalAmount: number;
}

export interface OrderStatusResponseBody {
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus | null;
}
