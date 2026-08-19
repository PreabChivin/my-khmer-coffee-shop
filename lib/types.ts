import type { Element } from "@/lib/creatures";

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
  phone: string | null;
  username: string | null;
  dateOfBirth: string | null;
  loyaltyPoints: number;
  joinedAt: string;
  gameWins: number;
  role: Role;
  /** ISO string when soft-deleted (login blocked), else null. */
  deactivatedAt: string | null;
  /** True for accounts auto-flagged by the reserved test-email domain —
   *  see lib/testAccount.ts. Drives the "🤖 TEST" badge + bulk purge. */
  isTestAccount: boolean;
}

/** 👑 Admin per-customer profile: the account + lifetime arcade scoreboard. */
export interface CustomerProfileDTO {
  user: UserDTO;
  gameWins: number;
  gameLosses: number;
  gameTies: number;
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

/** 🖼️ Optional per-item layer positioning override — for asset packs whose
 *  layers AREN'T pre-aligned to one shared canvas. See
 *  components/avatar/AvatarPortrait.tsx's doc comment. */
export interface ImageOffset {
  xPercent?: number;
  yPercent?: number;
  scalePercent?: number;
}

export type ShopItemCategory = "HAT" | "EYEWEAR" | "OUTFIT" | "HANDHELD" | "BASE_CHARACTER";

/** 🧢 An Avatar Shop item (cosmetic OR a purchasable 2D base character —
 *  BASE_CHARACTER is just a 5th category, reusing the same buy/equip
 *  flow), with this user's ownership/equip state. */
export interface ShopItemDTO {
  id: string;
  slug: string;
  name: string;
  nameKh: string;
  category: ShopItemCategory;
  tier: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  cost: number;
  emoji: string;
  description: string | null;
  imageUrl: string | null;
  imageOffset: ImageOffset | null;
  owned: boolean;
  equipped: boolean;
}

/** 🐷 The public (no-ownership) subset of the shop catalog — fetched
 *  server-side for the homepage's Pet Zoo, which recommends real avatar
 *  items to guests and members alike, so it can't depend on the
 *  session-gated `/api/shop/items`. */
export type PublicShopItemDTO = Pick<
  ShopItemDTO,
  "id" | "slug" | "name" | "nameKh" | "category" | "tier" | "cost" | "emoji"
>;

/** 🏆 One ranked row on the Leaderboard — All-Time only for now (see
 *  app/api/leaderboard/route.ts's doc comment for why Daily/Weekly aren't
 *  real yet). */
export interface LeaderboardRowDTO {
  rank: number;
  id: string;
  name: string;
  loyaltyPoints: number;
}

/** ⚡ One recent real game win, for the homepage's live activity ticker —
 *  see app/api/games/live-ticker/route.ts's doc comment: this is always
 *  real GameSession data, never a fabricated placeholder. */
export interface LiveTickerEntryDTO {
  id: string;
  winnerName: string;
  gameType: "TICTACTOE" | "RPS";
  at: string;
}

export interface LiveTickerResponseDTO {
  entries: LiveTickerEntryDTO[];
  /** Real completed-match count per gameType since midnight — backs each
   *  Game Arena card's "played today" badge. */
  todayPlayedCounts: Record<string, number>;
  /** Rooms open and joinable RIGHT NOW, per gameType — an unaccepted
   *  PENDING challenge for the 1v1 games, a WAITING room for the quiz.
   *  Backs each card's "N rooms live" indicator; genuinely 0 on a quiet
   *  day rather than a decorative number. */
  openRoomCounts: Record<string, number>;
}

/** 🎡 Daily Lucky Spin — see lib/spin.ts + app/api/spin/route.ts. */
export interface SpinStatusDTO {
  alreadySpunToday: boolean;
}

export interface SpinResultDTO {
  pointsWon: number;
  loyaltyPoints: number;
}

/** 🔍 The intentionally-public subset of another user's profile, shown via
 *  PublicPlayerModal — id/name/points/badges/equipped items ONLY, never
 *  email/phone/passwordHash. `equipped` includes the BASE_CHARACTER slot
 *  alongside HAT/EYEWEAR/OUTFIT/HANDHELD (at most one per category). */
export interface PublicEquippedItemDTO {
  category: ShopItemCategory;
  slug: string;
  name: string;
  nameKh: string;
  emoji: string;
  imageUrl: string | null;
  imageOffset: ImageOffset | null;
}

export interface PublicPlayerProfileDTO {
  id: string;
  name: string;
  loyaltyPoints: number;
  badges: string[];
  equipped: PublicEquippedItemDTO[];
}

/** 💎 One row of the admin-facing Cafe Points audit trail (grant or
 *  deduction) — see PointsAdjustment in schema.prisma. */
export interface PointsAdjustmentDTO {
  id: string;
  amount: number;
  reason: string;
  balanceAfter: number;
  adminName: string | null;
  createdAt: string;
}

/** 🔔 One registered customer's Telegram notification status, for the admin
 *  panel. There is no `User.telegramChatId` column — this is DERIVED from
 *  that customer's most-recently-linked Order (see
 *  lib/telegramSubscribers.ts), which is the real source of truth. */
export interface TelegramSubscriberDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  telegramChatId: string | null;
  telegramUsername: string | null;
  isTelegramConnected: boolean;
  telegramConnectedAt: string | null;
}

export interface TelegramSubscriberStatsDTO {
  totalUsers: number;
  connectedCount: number;
  /** Distinct chat ids ever seen (TelegramSession + Order), including ones
   *  never tied to a registered account (device-linked before any order,
   *  or a guest checkout) — always >= connectedCount. */
  discoveredChatIdCount: number;
  subscribers: TelegramSubscriberDTO[];
}

/** 🎯 A daily mission, with this user's progress for today. */
export interface MissionDTO {
  key: string;
  title: string;
  titleKh: string;
  emoji: string;
  rewardPoints: number;
  completed: boolean;
  claimed: boolean;
  /** Occurrences recorded this period. */
  progress: number;
  /** Occurrences needed; 1 for a plain did-it-happen quest. */
  target: number;
  cadence: "DAILY" | "WEEKLY";
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

/** 🧠 Trivia Quiz Show — separate DTO family from GameDetailDTO (2-4
 *  players, not a fixed pair). See lib/quizDto.ts for how these are built
 *  and app/api/quiz/* for the routes that serve them. */
export type QuizMatchStatus = "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface QuizPlayerDTO {
  id: string;
  name: string;
  score: number;
  hasAnsweredCurrent: boolean;
}

export interface QuizQuestionDTO {
  index: number;
  totalQuestions: number;
  category: string;
  textKm: string;
  choicesKm: [string, string, string, string];
  /** Only present once safe to reveal — I've already answered this
   *  question, or the match has moved past it. Withheld from every other
   *  still-deciding player, same anti-peek principle as RPS's
   *  opponentChoice. */
  correctIndex: number | null;
  /** My own submitted choice for this question, if I've answered. */
  myChoice: number | null;
}

export interface QuizMatchDetailDTO {
  id: string;
  status: QuizMatchStatus;
  capacity: number;
  players: QuizPlayerDTO[];
  question: QuizQuestionDTO | null;
  /** ISO timestamp — client computes the countdown from this, not a
   *  server-pushed "seconds remaining" that would go stale between polls. */
  questionDeadlineAt: string | null;
  myUserId: string;
  /** Sorted desc by score — populated only once status is COMPLETED. */
  podium: QuizPlayerDTO[] | null;
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


/** 🃏 One owned creature card, flattened with its species data + derived
 *  power so the UI never has to re-run lib/cardEngine math itself. */
export interface CreatureCardDTO {
  id: string;
  speciesId: string;
  nameEn: string;
  nameKm: string;
  element: Element;
  /** Body-shape hint for the procedural SVG art. */
  shape: string;
  emoji: string;
  loreEn: string;
  loreKm: string;
  stars: number;
  baseCp: number;
  /** CP at the current level — what actually matters in battle. */
  power: number;
  level: number;
  exp: number;
  /** EXP required for the next level; 0 once max level. */
  expNeeded: number;
  isShiny: boolean;
}

export interface CollectionResponseDTO {
  cards: CreatureCardDTO[];
  /** Live Diamond balance (User.loyaltyPoints). */
  loyaltyPoints: number;
  packCost: number;
}

export interface PackOpenResultDTO {
  cards: CreatureCardDTO[];
  loyaltyPoints: number;
}

export interface UpgradeResultDTO {
  card: CreatureCardDTO;
  loyaltyPoints: number;
  expGained: number;
  levelsGained: number;
}
