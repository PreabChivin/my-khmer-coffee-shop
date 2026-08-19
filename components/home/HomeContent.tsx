"use client";

import Link from "next/link";
import { Gamepad2, Sparkles, Trophy, Users2, Lock } from "lucide-react";
import CafeLoungeBanner from "@/components/home/CafeLoungeBanner";
import PetZoo from "@/components/home/PetZoo";
import { HomeLeftRail, HomeRightRail } from "@/components/home/SideRails";
import WelcomePopup from "@/components/home/WelcomePopup";
import { useChat } from "@/contexts/ChatContext";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PublicShopItemDTO } from "@/lib/types";

interface GameLobbyCard {
  key: string;
  emoji: string;
  titleKm: string;
  titleEn: string;
  descKm: string;
  descEn: string;
}

// 🎮 Real, working, multiplayer today — both reuse the existing Café Lounge
// challenge/accept flow (GameSession + app/api/chat/games/*), opened via the
// Social Lounge drawer's own game menu rather than a separate matchmaker.
const LIVE_GAMES: GameLobbyCard[] = [
  {
    key: "TICTACTOE",
    emoji: "⭕",
    titleKm: "អុក-តុក-តេ",
    titleEn: "Tic-Tac-Toe",
    descKm: "ប្រកួត ១ទល់១ ក្នុង Social Lounge",
    descEn: "1v1 in the Social Lounge",
  },
  {
    key: "RPS",
    emoji: "✊",
    titleKm: "កូន-ក្រដាស-កន្ត្រៃ",
    titleEn: "Rock · Paper · Scissors",
    descKm: "ប្រកួត ១ទល់១ ក្នុង Social Lounge",
    descEn: "1v1 in the Social Lounge",
  },
];

// 🔒 Announced concepts that aren't real games yet — shown honestly as
// locked/upcoming rather than faked or silently dropped.
const COMING_SOON_GAMES: GameLobbyCard[] = [
  {
    key: "QUIZ",
    emoji: "☕",
    titleKm: "ការប្រកួតសំណួរកាហ្វេ",
    titleEn: "Coffee Quiz Battle",
    descKm: "ឆាប់ៗនេះ",
    descEn: "Coming Soon",
  },
  {
    key: "RUNNER",
    emoji: "🏃",
    titleKm: "រត់អាកែត 3D",
    titleEn: "Cafe Runner 3D",
    descKm: "ឆាប់ៗនេះ",
    descEn: "Coming Soon",
  },
  {
    key: "TAP",
    emoji: "🧋",
    titleKm: "តាប់តែលឿន",
    titleEn: "Boba Tap Rush",
    descKm: "ឆាប់ៗនេះ",
    descEn: "Coming Soon",
  },
  {
    key: "PUZZLE",
    emoji: "🧩",
    titleKm: "ល្បែងផ្គុំរូបនំ",
    titleEn: "Pastry Puzzle",
    descKm: "ឆាប់ៗនេះ",
    descEn: "Coming Soon",
  },
];

const FEATURES = [
  { icon: Gamepad2, titleKm: "លេងផ្ទាល់", titleEn: "Play in real time", descKm: "ប្រកួតជាមួយសមាជិកផ្សេងទៀតភ្លាមៗ", descEn: "Match live against other players" },
  { icon: Trophy, titleKm: "ឡើងចំណាត់ថ្នាក់", titleEn: "Climb the ranks", descKm: "ឈ្នះកាន់តែច្រើន ចំណាត់ថ្នាក់កាន់តែខ្ពស់", descEn: "Win more, rank higher on the Leaderboard" },
  { icon: Sparkles, titleKm: "តុបតែងតួអង្គ", titleEn: "Customize your avatar", descKm: "ចំណាយពិន្ទុដែលរកបានទៅលើសម្លៀកបំពាក់", descEn: "Spend earned points on gear" },
];

export default function HomeContent({ shopItems }: { shopItems: PublicShopItemDTO[] }) {
  const { user } = useSession();
  const { openChat } = useChat();
  const { lang } = useLanguage();
  const km = lang === "km";

  return (
    <div>
      {/* 🎉 First-visit registration promo (unauth guests only, shown once) */}
      <WelcomePopup />

      {/* 💎🎯 Side rails — fill the wide margins beside the centered column on
          large screens with real, functional widgets instead of empty space */}
      <HomeLeftRail />
      <HomeRightRail />

      {/* Hero */}
      <section className="kbach-overlay relative overflow-hidden bg-gradient-to-br from-lavender-500 via-crimson-500 to-clay-500 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="animate-pop-in font-heading text-3xl font-extrabold drop-shadow-md sm:text-5xl">
            BENCHIMIN ARCADE 🕹️
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-white/90 sm:text-base">
            ទីលានប្រកួតប្រជែងហ្គេមកំសាន្ត និងលេងជាមួយគ្នាយ៉ាងសប្បាយរីករាយ
          </p>
          {user && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur-sm">
              💎 {user.loyaltyPoints.toLocaleString()} {km ? "ពិន្ទុអាកែត" : "Arcade Points"}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/leaderboard"
              className="btn-tactile flex items-center gap-1.5 rounded-full bg-white/90 px-5 py-2.5 text-sm font-extrabold text-crimson-600 shadow-md transition-transform hover:scale-105"
            >
              <Trophy size={16} /> {km ? "តារាងចំណាត់ថ្នាក់" : "Leaderboard"}
            </Link>
            <Link
              href="/avatar-studio"
              className="btn-tactile flex items-center gap-1.5 rounded-full bg-white/20 px-5 py-2.5 text-sm font-extrabold text-white shadow-md backdrop-blur-sm transition-transform hover:scale-105"
            >
              <Sparkles size={16} /> {km ? "ស្ទូឌីយោអវតារ" : "Avatar Studio"}
            </Link>
          </div>
        </div>
      </section>

      {/* 💬 Social Lounge entry point */}
      <CafeLoungeBanner />

      {/* 🎮 Game Arena lobby */}
      <section id="game-arena" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
        <h2 className="mb-1 flex items-center gap-2 font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
          <Gamepad2 size={22} /> {km ? "ទីលានហ្គេម" : "Game Arena"}
        </h2>
        <p className="mb-5 text-sm text-coffee-500 dark:text-cream-300">
          {km ? "ជ្រើសរើសហ្គេម ហើយប្រកួតភ្លាមៗជាមួយសមាជិកផ្សេងទៀត" : "Pick a game and challenge another player right now"}
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {LIVE_GAMES.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={openChat}
              className="khmer-card btn-tactile group flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-br from-matcha-400 to-matcha-600 p-5 text-center text-white shadow-md"
            >
              <span className="text-5xl drop-shadow-md transition-transform group-hover:scale-110">
                {g.emoji}
              </span>
              <p className="font-heading text-sm font-extrabold">{km ? g.titleKm : g.titleEn}</p>
              <p className="text-[11px] font-semibold text-white/85">{km ? g.descKm : g.descEn}</p>
              <span className="mt-1 rounded-full bg-white/25 px-3 py-1 text-[10px] font-extrabold">
                {km ? "ចាប់ផ្ដើមលេង" : "PLAY NOW"}
              </span>
            </button>
          ))}
          {COMING_SOON_GAMES.map((g) => (
            <div
              key={g.key}
              className="khmer-card flex flex-col items-center gap-2 rounded-3xl bg-cream-100 p-5 text-center opacity-70 dark:bg-coffee-800"
            >
              <span className="text-5xl grayscale">{g.emoji}</span>
              <p className="font-heading text-sm font-extrabold text-coffee-700 dark:text-cream-200">
                {km ? g.titleKm : g.titleEn}
              </p>
              <span className="mt-1 flex items-center gap-1 rounded-full bg-coffee-200 px-3 py-1 text-[10px] font-extrabold text-coffee-600 dark:bg-coffee-900 dark:text-cream-400">
                <Lock size={10} /> {km ? g.descKm : g.descEn}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features band */}
      <section className="border-y border-gold-500/30 bg-cream-50 dark:bg-coffee-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
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
      <section className="kbach-overlay relative overflow-hidden bg-gradient-to-br from-clay-400 via-crimson-400 to-clay-500 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
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

      {/* 🐷🐔🦆🐘🦖🐻 Pet Zoo — roaming critter engine, recommends real avatar
          items from the shop catalog */}
      <PetZoo items={shopItems} />
    </div>
  );
}
