"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, Sparkles, Trophy, Users2, Lock } from "lucide-react";
import CafeLoungeBanner from "@/components/home/CafeLoungeBanner";
import PetZoo from "@/components/home/PetZoo";
import WelcomePopup from "@/components/home/WelcomePopup";
import HeroAvatarStage from "@/components/home/HeroAvatarStage";
import LiveWinTicker from "@/components/home/LiveWinTicker";
import LuckySpinModal from "@/components/arcade/LuckySpinModal";
import MiniLeaderboard from "@/components/arcade/MiniLeaderboard";
import MissionsColumn from "@/components/arcade/MissionsColumn";
import PlayerProfileCard from "@/components/arcade/PlayerProfileCard";
import GameLobbyModal from "@/components/games/GameLobbyModal";
import QuizLobbyModal from "@/components/games/QuizLobbyModal";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/soundEngine";
import type { GameType, LiveTickerResponseDTO, PublicShopItemDTO } from "@/lib/types";

type Capacity = "DUEL" | "PARTY" | "SOLO";

const CAPACITY_BADGE: Record<Capacity, { km: string; en: string }> = {
  DUEL: { km: "👥 ២ នាក់ (1v1)", en: "👥 1v1 Duel" },
  PARTY: { km: "👥 ២-៤ នាក់", en: "👥 2-4 Players" },
  SOLO: { km: "👤 លេងម្នាក់ឯង", en: "👤 Solo Play" },
};

interface GameLobbyCard {
  key: string;
  emoji: string;
  titleKm: string;
  titleEn: string;
  descKm: string;
  descEn: string;
  /** Gradient used for the card rim + emoji halo, not a flat fill — the
   *  surface itself stays glass so label text keeps full contrast. */
  gradient: string;
  capacity: Capacity;
}

// 🎮 Real, working multiplayer today. "PLAY NOW" opens the auto-matchmaking
// lobby directly (no chat invite) — see components/games/GameLobbyModal.
const LIVE_GAMES: GameLobbyCard[] = [
  {
    key: "TICTACTOE",
    emoji: "⭕",
    titleKm: "អុក-តុក-តេ",
    titleEn: "Tic-Tac-Toe",
    descKm: "ចូលលេងភ្លាមៗ — គូគូស្វ័យប្រវត្តិ",
    descEn: "Instant play — auto-matched",
    gradient: "from-lavender-500 to-crimson-400",
    capacity: "DUEL",
  },
  {
    key: "RPS",
    emoji: "✊",
    titleKm: "កូន-ក្រដាស-កន្ត្រៃ",
    titleEn: "Rock · Paper · Scissors",
    descKm: "ចូលលេងភ្លាមៗ — គូគូស្វ័យប្រវត្តិ",
    descEn: "Instant play — auto-matched",
    gradient: "from-crimson-500 to-gold-400",
    capacity: "DUEL",
  },
];

// 🧠 Trivia Quiz Show — its own card because it opens QuizLobbyModal (the
// 2-4 player party room) rather than the 1v1 GameLobbyModal above.
const QUIZ_CARD: GameLobbyCard = {
  key: "QUIZ",
  emoji: "🧠",
  titleKm: "ការប្រកួតសំណួរ",
  titleEn: "Trivia Quiz Show",
  descKm: "ចូលលេងភ្លាមៗ — ២-៤ នាក់ក្នុងបន្ទប់មួយ",
  descEn: "Instant play — 2-4 players per room",
  gradient: "from-gold-400 to-lavender-500",
  capacity: "PARTY",
};

// 🔒 Announced concepts that are not real games yet — shown honestly as
// locked/upcoming rather than faked or silently dropped.
const COMING_SOON_GAMES: GameLobbyCard[] = [
  {
    key: "RUNNER",
    emoji: "🏃",
    titleKm: "រត់អាកែត 3D",
    titleEn: "Cafe Runner 3D",
    descKm: "ឆាប់ៗនេះ",
    descEn: "Coming Soon",
    gradient: "from-coffee-300 to-coffee-400",
    capacity: "SOLO",
  },
  {
    key: "LUDO",
    emoji: "🎲",
    titleKm: "បោះគ្រាប់ឡុកឡាក់",
    titleEn: "Ludo / Dice Battle",
    descKm: "ឆាប់ៗនេះ",
    descEn: "Coming Soon",
    gradient: "from-coffee-300 to-coffee-400",
    capacity: "PARTY",
  },
  {
    key: "TAP",
    emoji: "🧋",
    titleKm: "តាប់តែលឿន",
    titleEn: "Boba Tap Rush",
    descKm: "ឆាប់ៗនេះ",
    descEn: "Coming Soon",
    gradient: "from-coffee-300 to-coffee-400",
    capacity: "SOLO",
  },
  {
    key: "PUZZLE",
    emoji: "🧩",
    titleKm: "ល្បែងផ្គុំរូបនំ",
    titleEn: "Pastry Puzzle Match",
    descKm: "ឆាប់ៗនេះ",
    descEn: "Coming Soon",
    gradient: "from-coffee-300 to-coffee-400",
    capacity: "SOLO",
  },
];

const FEATURES = [
  { icon: Gamepad2, titleKm: "លេងផ្ទាល់", titleEn: "Play in real time", descKm: "ប្រកួតជាមួយសមាជិកផ្សេងទៀតភ្លាមៗ", descEn: "Match live against other players" },
  { icon: Trophy, titleKm: "ឡើងចំណាត់ថ្នាក់", titleEn: "Climb the ranks", descKm: "ឈ្នះកាន់តែច្រើន ចំណាត់ថ្នាក់កាន់តែខ្ពស់", descEn: "Win more, rank higher on the Leaderboard" },
  { icon: Sparkles, titleKm: "តុបតែងតួអង្គ", titleEn: "Customize your avatar", descKm: "ចំណាយពិន្ទុដែលរកបានទៅលើសម្លៀកបំពាក់", descEn: "Spend earned points on gear" },
];

export default function HomeContent({ shopItems }: { shopItems: PublicShopItemDTO[] }) {
  const { user } = useSession();
  const { openAuth } = useAuthModal();
  const { lang } = useLanguage();
  const km = lang === "km";

  // 🟢 Real activity numbers per game — completed-today and rooms open
  // right now, both straight from /api/games/live-ticker. Never invented:
  // a quiet day genuinely shows 0.
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({});
  const [openRooms, setOpenRooms] = useState<Record<string, number>>({});
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/games/live-ticker")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: LiveTickerResponseDTO | null) => {
          if (cancelled || !data) return;
          setTodayCounts(data.todayPlayedCounts);
          setOpenRooms(data.openRoomCounts ?? {});
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // 🚪 Which real game's waiting room is open right now, if any.
  const [activeLobby, setActiveLobby] = useState<GameType | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  function playNow(gameType: GameType) {
    playSound("match");
    if (!user) {
      openAuth();
      return;
    }
    setActiveLobby(gameType);
  }
  function playQuizNow() {
    playSound("match");
    if (!user) {
      openAuth();
      return;
    }
    setQuizOpen(true);
  }

  return (
    <div>
      {/* 🎉 First-visit registration promo (unauth guests only, shown once) */}
      <WelcomePopup />

      {/* 🎡 Floating Daily Lucky Spin — free once-a-day bonus points */}
      <LuckySpinModal />

      {/* ══ HERO: 3-column dashboard ══════════════════════════════════════
          Profile / banner / missions all live INSIDE the normal document
          flow here. They used to be `fixed` side rails (the deleted
          components/home/SideRails.tsx), which is exactly why they could
          ride over the heading on some viewports — an in-flow grid can't. */}
      <section className="kbach-overlay relative z-10 overflow-hidden bg-gradient-to-br from-lavender-500 via-crimson-500 to-clay-500 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-gold-400/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-14">
          {/* ── Left (3 cols): player profile + champions ── */}
          <div className="order-2 flex flex-col gap-3 lg:order-1 lg:col-span-3">
            <PlayerProfileCard />
            <MiniLeaderboard />
          </div>

          {/* ── Center (6 cols): the arcade banner itself ── */}
          <div className="order-1 text-center lg:order-2 lg:col-span-6">
            <p className="animate-pop-in font-heading text-4xl font-extrabold leading-tight drop-shadow-md sm:text-5xl">
              BENCHIMIN ARCADE 🕹️
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-white/90">
              ទីលានប្រកួតប្រជែងហ្គេមកំសាន្ត និងលេងជាមួយគ្នាយ៉ាងសប្បាយរីករាយ
            </p>

            <div className="mt-5">
              <HeroAvatarStage />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="#game-arena"
                onClick={() => playSound("click")}
                className="btn-tactile flex items-center gap-1.5 rounded-full bg-gold-400 px-5 py-2.5 text-sm font-extrabold text-coffee-900 shadow-lg transition-transform hover:scale-105"
              >
                <Gamepad2 size={16} /> {km ? "លេងភ្លាម" : "Play Now"} ⚡
              </Link>
              <Link
                href="/avatar-studio"
                onClick={() => playSound("click")}
                className="btn-tactile flex items-center gap-1.5 rounded-full bg-white/20 px-5 py-2.5 text-sm font-extrabold text-white shadow-md backdrop-blur-sm transition-transform hover:scale-105"
              >
                <Sparkles size={16} /> {km ? "ស្ទូឌីយោអវតារ" : "Avatar Studio"} 👗
              </Link>
              <Link
                href="/leaderboard"
                onClick={() => playSound("click")}
                className="btn-tactile flex items-center gap-1.5 rounded-full bg-white/20 px-5 py-2.5 text-sm font-extrabold text-white shadow-md backdrop-blur-sm transition-transform hover:scale-105"
              >
                <Trophy size={16} /> {km ? "តារាងចំណាត់ថ្នាក់" : "Leaderboard"}
              </Link>
            </div>
          </div>

          {/* ── Right (3 cols): daily missions ── */}
          <div className="order-3 lg:col-span-3 lg:order-3">
            <MissionsColumn />
          </div>
        </div>

        {/* ⚡ Live win ticker — a clean running border under the hero. Real
            GameSession wins only; renders nothing on a quiet day. */}
        <LiveWinTicker />
      </section>

      {/* 💬 Social Lounge entry point */}
      <div className="relative z-10">
        <CafeLoungeBanner />
      </div>

      {/* ══ GAME ARENA ═══════════════════════════════════════════════════ */}
      <section
        id="game-arena"
        className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6"
      >
        <h2 className="mb-1 flex items-center gap-2 font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
          <Gamepad2 size={22} /> {km ? "ទីលានហ្គេម" : "Game Arena"}
        </h2>
        <p className="mb-5 text-sm text-coffee-500 dark:text-cream-300">
          {km
            ? "ជ្រើសរើសហ្គេម ហើយប្រកួតភ្លាមៗជាមួយសមាជិកផ្សេងទៀត"
            : "Pick a game and challenge another player right now"}
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LIVE_GAMES.map((g) => (
            <LiveGameCard
              key={g.key}
              game={g}
              playedToday={todayCounts[g.key] ?? 0}
              roomsLive={openRooms[g.key] ?? 0}
              km={km}
              onPlay={() => playNow(g.key as GameType)}
            />
          ))}
          <LiveGameCard
            game={QUIZ_CARD}
            playedToday={todayCounts.QUIZ ?? 0}
            roomsLive={openRooms.QUIZ ?? 0}
            km={km}
            onPlay={playQuizNow}
          />
          {COMING_SOON_GAMES.map((g) => (
            <LockedGameCard key={g.key} game={g} km={km} />
          ))}
        </div>
      </section>

      {activeLobby && (
        <GameLobbyModal gameType={activeLobby} onClose={() => setActiveLobby(null)} />
      )}
      {quizOpen && <QuizLobbyModal onClose={() => setQuizOpen(false)} />}

      {/* Features band */}
      <section className="relative z-10 border-y border-gold-500/30 bg-cream-50 dark:bg-coffee-900">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {FEATURES.map((f) => (
            <div key={f.titleEn} className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-clay-50 text-clay-500 dark:bg-coffee-800">
                <f.icon size={22} />
              </span>
              <div>
                <h3 className="font-semibold text-coffee-900 dark:text-cream-50">
                  {km ? f.titleKm : f.titleEn}
                </h3>
                <p className="text-sm text-coffee-500 dark:text-cream-300">
                  {km ? f.descKm : f.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vibe band */}
      <section className="kbach-overlay relative z-10 overflow-hidden bg-gradient-to-br from-clay-400 via-crimson-400 to-clay-500 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
          <div className="animate-bounce-cute text-5xl">🕹️💖</div>
          <p className="font-heading text-2xl font-extrabold drop-shadow-sm sm:text-3xl">
            {km ? "សប្បាយ លេង ជាមួយគ្នា!" : "Play together, have fun!"}
          </p>
          <p className="max-w-md text-sm font-medium text-white/90">
            {km
              ? "ចូលរួម Social Lounge ដើម្បីជជែក ផ្ញើស្ទីខឺ និងអញ្ជើញមិត្តភក្តិមកប្រកួត"
              : "Join the Social Lounge to chat, send stickers, and invite friends to play"}
          </p>
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-bold backdrop-blur-sm">
            <Users2 size={14} /> {km ? "លេងជាមួយសហគមន៍" : "Play with the community"}
          </div>
        </div>
      </section>

      {/* 🐷🐔🦆🐘🦖🐻 Pet Zoo — roams in a bottom lane at z-[5], i.e. BEHIND
          every section above (all relative z-10), so it can never cover a
          card, button or heading again. */}
      <PetZoo items={shopItems} />
    </div>
  );
}

/** 🎮 A playable game card: gradient rim + glass surface (keeps label text
 *  dark-on-light for full contrast), capacity badge, real live-room count,
 *  and a high-contrast CTA. */
function LiveGameCard({
  game,
  playedToday,
  roomsLive,
  km,
  onPlay,
}: {
  game: GameLobbyCard;
  playedToday: number;
  roomsLive: number;
  km: boolean;
  onPlay: () => void;
}) {
  return (
    <div
      className={`group rounded-3xl bg-gradient-to-br p-[1.5px] shadow-lg transition-all duration-200 hover:-translate-y-2 hover:shadow-2xl ${game.gradient}`}
    >
      <div className="relative flex h-full flex-col items-center gap-2 overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-cream-50/90 p-5 text-center backdrop-blur-xl dark:bg-coffee-900/85">
        {/* colored halo behind the emoji — decorative, never over text */}
        <div
          className={`pointer-events-none absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br opacity-25 blur-2xl ${game.gradient}`}
        />

        <div className="relative flex w-full items-center justify-between gap-2">
          <span className="rounded-full bg-coffee-900/85 px-2.5 py-1 text-[10px] font-extrabold text-cream-50 dark:bg-coffee-950">
            {km ? CAPACITY_BADGE[game.capacity].km : CAPACITY_BADGE[game.capacity].en}
          </span>
          {roomsLive > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-matcha-100 px-2.5 py-1 text-[10px] font-extrabold text-matcha-700 dark:bg-matcha-500/20 dark:text-matcha-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-matcha-500" />
              {roomsLive} {km ? "បន្ទប់" : roomsLive === 1 ? "room" : "rooms"}
            </span>
          ) : (
            <span className="rounded-full bg-coffee-100 px-2.5 py-1 text-[10px] font-bold text-coffee-500 dark:bg-coffee-800 dark:text-cream-400">
              {km ? "ទំនេរ" : "Open"}
            </span>
          )}
        </div>

        <span className="relative mt-2 text-6xl drop-shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6">
          {game.emoji}
        </span>
        <p className="relative font-heading text-base font-extrabold text-coffee-900 dark:text-cream-50">
          {km ? game.titleKm : game.titleEn}
        </p>
        <p className="relative text-[11px] font-semibold text-coffee-500 dark:text-cream-300">
          {km ? game.descKm : game.descEn}
        </p>
        <p className="relative text-[10px] font-bold text-coffee-400 dark:text-cream-400">
          🎯 {playedToday} {km ? "លេងថ្ងៃនេះ" : "played today"}
        </p>

        <button
          type="button"
          onClick={onPlay}
          className="btn-tactile relative mt-auto w-full rounded-full bg-gradient-to-r from-accent to-accent-hover py-2.5 text-xs font-extrabold text-white shadow-md transition-transform hover:scale-105"
        >
          {km ? "ចូលលេង ⚡" : "PLAY NOW ⚡"}
        </button>
      </div>
    </div>
  );
}

/** 🔒 An announced-but-unbuilt concept. Deliberately non-interactive — no
 *  dummy button that pretends to launch something. */
function LockedGameCard({ game, km }: { game: GameLobbyCard; km: boolean }) {
  return (
    <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-3xl border border-coffee-200/70 bg-cream-100/70 p-5 text-center backdrop-blur-sm dark:border-coffee-700 dark:bg-coffee-800/50">
      <div className="flex w-full items-center justify-between gap-2">
        <span className="rounded-full bg-coffee-200 px-2.5 py-1 text-[10px] font-bold text-coffee-600 dark:bg-coffee-900 dark:text-cream-400">
          {km ? CAPACITY_BADGE[game.capacity].km : CAPACITY_BADGE[game.capacity].en}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-coffee-800/90 px-2.5 py-1 text-[10px] font-extrabold text-cream-50 dark:bg-coffee-950">
          <Lock size={9} /> {km ? game.descKm : game.descEn}
        </span>
      </div>

      <span className="mt-2 text-6xl opacity-60 grayscale">{game.emoji}</span>
      <p className="font-heading text-base font-extrabold text-coffee-600 dark:text-cream-300">
        {km ? game.titleKm : game.titleEn}
      </p>
      <p className="text-[11px] font-semibold text-coffee-400 dark:text-cream-400">
        {km ? "ចាំមើលឆាប់ៗនេះណា៎!" : "Stay tuned!"}
      </p>
    </div>
  );
}
