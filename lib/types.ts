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
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "FAILED";

export interface CartItem {
  productId: string;
  nameEn: string;
  nameKh: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CheckoutRequestBody {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  address?: string;
  note?: string;
  items: Array<{ productId: string; quantity: number }>;
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
