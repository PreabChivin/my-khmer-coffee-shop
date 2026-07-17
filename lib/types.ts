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
/** 🔐 CUSTOMER (default), STAFF (kitchen/menu/marketing access), or ADMIN
 *  (also User Management — role changes, password resets). */
export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export interface UserDTO {
  id: string;
  email: string;
  username: string | null;
  name: string;
  phone: string | null;
  loyaltyPoints: number;
  /** ISO date string, or null if not on file. Generation is derived from it. */
  dateOfBirth: string | null;
  role: Role;
  /** Compressed base64 JPEG data URL, or null — see User.avatarUrl. */
  avatarUrl: string | null;
}

/** 👑 One row in the admin "Registered Customers" / User Management table. */
export interface AdminCustomerRowDTO {
  id: string;
  name: string;
  email: string;
  username: string | null;
  dateOfBirth: string | null;
  loyaltyPoints: number;
  joinedAt: string;
  orderCount: number;
  role: Role;
  /** ISO string when soft-deleted (login blocked), else null. */
  deactivatedAt: string | null;
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
  /** 🕒 Timeline stage timestamps for the history card's mini-stepper. */
  timeline: OrderTimelineStamps;
  items: { nameEn: string; nameKh: string; quantity: number; price: number }[];
}

/** 👑 Admin per-customer profile: the account + lifetime value + history. */
export interface CustomerProfileDTO {
  user: UserDTO;
  lifetimeValue: number;
  orderCount: number;
  orders: OrderHistoryItemDTO[];
  savedAddresses: SavedAddressDTO[];
}

/** 📣 A notification shown in the customer's bell (broadcast or targeted). */
export interface NotificationDTO {
  id: string;
  title: string;
  body: string;
  href: string | null;
  emoji: string;
  createdAt: string;
  isBroadcast: boolean;
}

/** 🎟️ A monthly lucky-draw configuration + result. */
export interface LuckyDrawDTO {
  id: string;
  title: string;
  prizeName: string;
  prizeEmoji: string;
  month: string;
  minPoints: number;
  tierLabel: string | null;
  winnerName: string | null;
  drawnAt: string | null;
  createdAt: string;
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
  /** 📍 Exact pin dropped in the delivery-address map picker (optional —
   *  absent for PickUp orders or a manually-typed fallback address). */
  latitude?: number;
  longitude?: number;
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

/** 📍 One entry in a logged-in customer's address book. */
export interface SavedAddressDTO {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

/** A single geocoding result — either a forward search hit or a reverse
 *  lookup's resolved label. */
export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

/** 🕒 Per-stage timeline timestamps (ISO strings, null = not reached yet). */
export interface OrderTimelineStamps {
  placedAt: string;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
}

export interface OrderStatusResponseBody {
  orderId: string;
  orderStatus: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus | null;
  /** ⭐ Null until the customer rates this order (also the "already rated" guard). */
  customerRating: number | null;
  /** 🔔 True once the customer has linked their Telegram chat via the deep-link button. */
  telegramLinked: boolean;
  /** 🕒 Timeline stage timestamps. */
  timeline: OrderTimelineStamps;
}

/** 🎁 A redeemable reward in the loyalty store. */
export interface RewardDTO {
  id: string;
  name: string;
  nameKh: string;
  cost: number;
  emoji: string;
  description: string | null;
  isAvailable: boolean;
}

/** 🧾 A customer's redemption record. */
export interface RedemptionDTO {
  id: string;
  rewardName: string;
  rewardEmoji: string;
  cost: number;
  status: "PENDING" | "FULFILLED";
  createdAt: string;
}

/** 👑 Admin view of a pending/fulfilled redemption to hand over. */
export interface AdminRedemptionDTO extends RedemptionDTO {
  userId: string;
  customerName: string;
  customerEmail: string;
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

/** 💬 Members' Lounge — the one shared, real-time-feeling chat room every
 *  logged-in member posts to. Author is a lightweight public-safe slice of
 *  UserDTO (never the full profile) plus a fun generation emoji, reused from
 *  the same lib/generation.ts helper the admin dashboard already uses. */
export type ChatEmoji = "❤️" | "🔥" | "💀" | "💯" | "😭";

export const CHAT_EMOJIS: ChatEmoji[] = ["❤️", "🔥", "💀", "💯", "😭"];

export interface ChatReactionSummary {
  emoji: ChatEmoji;
  count: number;
  /** Whether the requesting user is one of the reactors — drives the
   *  highlighted/"already reacted" pill style client-side. */
  reactedByMe: boolean;
}

/** 🎮 Mini-game supported types. */
export type GameType = "TICTACTOE" | "RPS";

/** ✊✋✌️ Rock-Paper-Scissors round state, exposed only on RPS games —
 *  simultaneous choices, not turn-based, so this is a distinct shape from
 *  the Tic-Tac-Toe `board`. `opponentChoice` stays null (hidden) until the
 *  round is COMPLETED, even though the server already knows it. */
export interface RPSDetailState {
  myChoice: "rock" | "paper" | "scissors" | null;
  opponentHasChosen: boolean;
  opponentChoice: "rock" | "paper" | "scissors" | null;
}
export type GameStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "DECLINED" | "CANCELLED";

/** Compact game summary embedded on a GAME_INVITE chat message, so the invite
 *  bubble in the feed can render its live state (Accept / Waiting / Open Board
 *  / result) straight from the polled message list — no extra request. */
export interface ChatGameSummary {
  id: string;
  gameType: GameType;
  status: GameStatus;
  player1: { id: string; name: string };
  player2: { id: string; name: string } | null;
  winnerId: string | null;
  isTie: boolean;
  /** True when the requesting user is player1 or player2 in this match. */
  iAmParticipant: boolean;
  /** 🎯 Set only for a targeted challenge (invite aimed at one member rather
   *  than open to the whole room) — the name is shown to everyone else so
   *  they understand why Accept isn't offered to them. */
  targetName: string | null;
  /** True when the viewer is allowed to accept this PENDING invite — open
   *  invites (no target) accept anyone but the challenger; targeted invites
   *  accept only the named target. Computed server-side so the client never
   *  has to re-derive the gating rule itself. */
  canAccept: boolean;
}

export type ChatMessageKind = "TEXT" | "STICKER" | "GAME_INVITE" | "GAME_RESULT";

export interface ChatMessageDTO {
  id: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: Role;
    generationEmoji: string;
    /** Profile picture — null falls back to a generationEmoji circle. */
    avatarUrl: string | null;
  };
  /** True only for the sender's own messages — gates the "delete"/"edit"
   *  affordances client-side (staff/admin can delete any message; see
   *  isStaff on the hook). */
  isMine: boolean;
  reactions: ChatReactionSummary[];
  /** "TEXT"/"STICKER" render as bubbles; "GAME_INVITE"/"GAME_RESULT" specially. */
  kind: ChatMessageKind;
  /** Present only on GAME_INVITE messages. */
  game: ChatGameSummary | null;
  /** True if the sender edited this after sending — the ORIGINAL text is not
   *  exposed to regular members, only to Staff/Admin (AdminChatMessageDTO). */
  isEdited: boolean;
}

/** 💌 Private 1-on-1 messaging — a sibling to the shared Café Lounge, not a
 *  replacement. Only "TEXT"/"STICKER" (no mini-games, no reactions, in this
 *  first pass). Since a thread always has exactly two participants, a
 *  message DTO only needs `isMine` (not a full author object like the room
 *  chat's ChatMessageDTO) — the other party is already known from the
 *  conversation the thread is showing. */
export type DirectMessageKind = "TEXT" | "STICKER";

export interface DirectMessageDTO {
  id: string;
  conversationId: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  isMine: boolean;
  kind: DirectMessageKind;
  isEdited: boolean;
}

export interface DirectConversationPeerDTO {
  id: string;
  name: string;
  role: Role;
  generationEmoji: string;
  avatarUrl: string | null;
}

/** One row in the "Active Private Chats" list — the peer + a preview of the
 *  most recent message, sorted by DirectConversation.updatedAt (bumped on
 *  every send, so this is a plain orderBy with no extra join). */
export interface DirectConversationSummaryDTO {
  id: string;
  peer: DirectConversationPeerDTO;
  lastMessage: {
    text: string;
    kind: DirectMessageKind;
    createdAt: string;
    isMine: boolean;
  } | null;
  updatedAt: string;
}

/** 🎮 Full board state for the game overlay — fetched on open and re-polled
 *  every ~1.5s while a board is on screen. `board` is emoji marks resolved
 *  server-side so the client never maps player slots to symbols itself. */
export interface GameDetailDTO {
  id: string;
  gameType: GameType;
  status: GameStatus;
  /** TICTACTOE only — 9 cells: an emoji mark or null. Empty array for RPS. */
  board: (string | null)[];
  player1: { id: string; name: string; mark: string };
  player2: { id: string; name: string; mark: string } | null;
  /** Whose move it is — TICTACTOE only; always null for RPS (no turns). */
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  isTie: boolean;
  /** "player1" | "player2" for a participant, else null (spectator). */
  mySlot: "player1" | "player2" | null;
  /** RPS only — null for TICTACTOE games. */
  rps: RPSDetailState | null;
}

export interface GameStatsDTO {
  wins: number;
  losses: number;
  ties: number;
}

/** 👑 Admin Chat Monitor row — deliberately a separate shape from
 *  ChatMessageDTO (never sent to regular members): includes the author's
 *  email and live moderation status, and — unlike the customer feed —
 *  includes soft-deleted messages so Staff/Admin retain a full audit trail. */
export interface AdminChatMessageDTO {
  id: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  deletedAt: string | null;
  /** True when the SENDER deleted their own message; false + deletedAt set
   *  means Staff/Admin moderation removed it instead. */
  isDeletedByUser: boolean;
  /** The message exactly as first sent, if it was ever edited — full audit
   *  visibility, never sent to the member-facing ChatMessageDTO. */
  originalText: string | null;
  editedAt: string | null;
  flagged: boolean;
  kind: ChatMessageKind;
  reactionCount: number;
  author: {
    id: string;
    name: string;
    email: string;
    role: Role;
    chatMutedUntil: string | null;
    chatBannedAt: string | null;
    avatarUrl: string | null;
  };
}

/** ✨ One recommended product on the account page — a heuristic over the
 *  member's own order history (their most-ordered product/category), NOT a
 *  trained ML model. `reason` tells the UI which of the two heuristics
 *  produced it, so it can show a matching Khmer label. */
export interface RecommendationDTO {
  product: ProductDTO;
  reason: "your-usual" | "popular-in-category" | "popular-overall";
}

/** 📊 Admin-side sales trend — a moving-average projection over recent daily
 *  totals, NOT a trained predictive model (see app/api/admin/analytics/predict
 *  for the exact heuristic and why). */
export interface SalesPredictionDTO {
  /** Last 7 days of {date, total}, oldest first — the basis for the trend. */
  recentDaily: { date: string; total: number }[];
  /** Simple average of recentDaily. */
  averageDailyTotal: number;
  /** Naive projection: averageDailyTotal carried forward one week. */
  projectedNextWeekTotal: number;
  /** "up" / "down" / "flat" — first half vs second half of recentDaily. */
  trend: "up" | "down" | "flat";
  /** % change between the two halves, signed. */
  trendPercent: number;
}
