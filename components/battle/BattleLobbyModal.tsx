"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Loader2, Swords, Repeat, Trophy, Skull } from "lucide-react";
import Confetti from "@/components/Confetti";
import CreatureCardArt from "@/components/cards/CreatureCardArt";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/soundEngine";
import { ELEMENTS } from "@/lib/creatures";
import {
  LOSS_EXP_PER_CARD,
  LOSS_REWARD_POINTS,
  WIN_EXP_PER_CARD,
  WIN_REWARD_POINTS,
} from "@/lib/battleEngine";
import type { BattleMatchDetailDTO, BattleRosterCardDTO } from "@/lib/types";

const POLL_MS = 1500;
const COUNTDOWN_FROM = 3;
const LABEL_TEXT: Record<string, { km: string; en: string; tone: string }> = {
  SUPER: { km: "⚡ ស័ក្តិសិទ្ធិខ្លាំង!", en: "⚡ SUPER EFFECTIVE!", tone: "text-gold-300" },
  WEAK: { km: "⚠️ គ្មានប្រសិទ្ធភាព", en: "⚠️ NOT EFFECTIVE", tone: "text-white/60" },
  NEUTRAL: { km: "សម្តែងធម្មតា", en: "Standard hit", tone: "text-white/80" },
};

export default function BattleLobbyModal({ onClose }: { onClose: () => void }) {
  const { user, refresh } = useSession();
  const { lang } = useLanguage();
  const km = lang === "km";

  const [match, setMatch] = useState<BattleMatchDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsDeck, setNeedsDeck] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [acting, setActing] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [flashDefender, setFlashDefender] = useState<"me" | "opponent" | null>(null);

  const wasWaitingRef = useRef(false);
  const lastActionSigRef = useRef<string | null>(null);
  const rewardsAppliedRef = useRef(false);

  // 1️⃣ Enter: create-or-instantly-join.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/battle/quick-match", { method: "POST" })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? (km ? "មិនអាចចូលរួមបានទេ។" : "Couldn't join."));
          setNeedsDeck(data.code === "NO_DECK");
          return;
        }
        setMatch(data as BattleMatchDetailDTO);
      })
      .catch(() => {
        if (!cancelled) setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2️⃣ Poll while the match is live.
  useEffect(() => {
    if (!match || match.status === "COMPLETED" || match.status === "CANCELLED") return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/battle/${match.id}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as BattleMatchDetailDTO;
        if (!cancelled) setMatch(data);
      } catch {
        // transient
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id, match?.status]);

  // 3️⃣ WAITING → ACTIVE countdown.
  useEffect(() => {
    if (match?.status === "WAITING") wasWaitingRef.current = true;
    if (match?.status === "ACTIVE" && wasWaitingRef.current) {
      wasWaitingRef.current = false;
      playSound("match");
      setCountdown(COUNTDOWN_FROM);
    }
  }, [match?.status]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      const t = setTimeout(() => setCountdown(null), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 800);
    return () => clearTimeout(t);
  }, [countdown]);

  // 4️⃣ React to a NEW lastAction (sound + flash + banner).
  const me = match?.players[0];
  const opponent = match?.players[1];
  useEffect(() => {
    if (!match?.lastAction) return;
    const sig = JSON.stringify(match.lastAction);
    if (lastActionSigRef.current === sig) return;
    lastActionSigRef.current = sig;

    if (match.lastAction.type === "ATTACK") {
      const iAmAttacker = match.lastAction.attackerUserId === match.myUserId;
      const side = iAmAttacker ? "opponent" : "me";
      setTimeout(() => {
        setFlashDefender(side);
        setTimeout(() => setFlashDefender(null), 420);
      }, 0);
      if (match.lastAction.label === "SUPER") playSound("superEffective");
      else if (match.lastAction.label === "WEAK") playSound("notEffective");
      else playSound("hit");
      if (match.lastAction.defenderFainted) {
        setTimeout(() => playSound("faint"), 250);
      }
    }
  }, [match?.lastAction, match?.myUserId]);

  // 5️⃣ Victory/defeat sound + confetti + point refresh, once.
  useEffect(() => {
    if (match?.status !== "COMPLETED" || rewardsAppliedRef.current) return;
    rewardsAppliedRef.current = true;
    const won = match.winnerUserId === match.myUserId;
    playSound(won ? "victory" : "defeat");
    if (won) setTimeout(() => setCelebrate(true), 0);
    refresh();
  }, [match?.status, match?.winnerUserId, match?.myUserId, refresh]);

  async function leave() {
    if (!match) {
      onClose();
      return;
    }
    setLeaving(true);
    try {
      await fetch(`/api/battle/${match.id}/leave`, { method: "POST" });
    } catch {
      // best-effort
    } finally {
      onClose();
    }
  }

  async function attack() {
    if (!match || acting || !match.isMyTurn) return;
    playSound("click");
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/battle/${match.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ATTACK" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (km ? "មិនអាចវាយប្រហារបានទេ។" : "Attack failed."));
        return;
      }
      setMatch(data as BattleMatchDetailDTO);
    } catch {
      setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
    } finally {
      setActing(false);
    }
  }

  async function switchTo(index: number) {
    if (!match || acting || !match.isMyTurn) return;
    playSound("click");
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/battle/${match.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SWITCH", index }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (km ? "មិនអាចប្តូរបានទេ។" : "Switch failed."));
        return;
      }
      setMatch(data as BattleMatchDetailDTO);
      setShowSwitcher(false);
    } catch {
      setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
    } finally {
      setActing(false);
    }
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-coffee-900/90 p-3 backdrop-blur-md sm:p-4">
      {celebrate && <Confetti />}
      <div className="khmer-card relative flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-coffee-950 via-coffee-900 to-lavender-950 text-white shadow-2xl">
        <button
          type="button"
          onClick={leave}
          aria-label="Close"
          disabled={leaving}
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform hover:scale-110 hover:bg-white/20 active:scale-95"
        >
          <X size={16} />
        </button>

        <div className="flex items-center justify-center gap-2 px-6 pt-5">
          <Swords size={18} />
          <p className="font-heading text-lg font-extrabold">
            {km ? "ទីលានប្រយុទ្ធធាតុ" : "Elemental Battle Arena"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-5 pt-2 sm:px-6">
          {error && (
            <div className="mb-3 flex flex-col items-center gap-2">
              <p className="rounded-full bg-crimson-600/90 px-3 py-1.5 text-center text-xs font-semibold text-white">
                {error}
              </p>
              {needsDeck && (
                <Link
                  href="/battle-deck"
                  onClick={onClose}
                  className="btn-tactile rounded-full bg-gradient-to-r from-gold-400 to-crimson-400 px-5 py-2 text-xs font-extrabold text-coffee-900 shadow-md"
                >
                  {km ? "ទៅរៀបចំកញ្ចប់ប្រយុទ្ធ" : "Build a Battle Deck"}
                </Link>
              )}
            </div>
          )}

          {needsDeck ? null : !match ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 size={28} className="animate-spin text-white/70" />
              <p className="text-sm text-white/70">{km ? "កំពុងរកគូប្រកួត..." : "Finding an opponent..."}</p>
            </div>
          ) : match.status === "WAITING" ? (
            <WaitingRoom km={km} me={me} onLeave={leave} leaving={leaving} />
          ) : countdown !== null ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="text-sm font-bold text-matcha-300">
                {km ? "គូប្រកួតរួចរាល់! ចាប់ផ្តើម..." : "Opponent found! Starting..."}
              </p>
              <span className="animate-pop-in text-7xl font-extrabold drop-shadow-lg">
                {countdown === 0 ? "⚔️" : countdown}
              </span>
            </div>
          ) : match.status === "ACTIVE" && me && opponent ? (
            <ArenaView
              km={km}
              match={match}
              me={me}
              opponent={opponent}
              acting={acting}
              flashDefender={flashDefender}
              showSwitcher={showSwitcher}
              onToggleSwitcher={() => setShowSwitcher((v) => !v)}
              onAttack={attack}
              onSwitch={switchTo}
            />
          ) : match.status === "COMPLETED" ? (
            <ResultScreen km={km} match={match} me={me} opponent={opponent} onClose={onClose} />
          ) : (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-white/70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitingRoom({
  km,
  me,
  onLeave,
  leaving,
}: {
  km: boolean;
  me: BattleMatchDetailDTO["players"][number] | undefined;
  onLeave: () => void;
  leaving: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold">
        {km ? "រង់ចាំគូប្រកួត [1/2]" : "Waiting for an opponent [1/2]"}
      </p>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <span className="animate-stage-glow flex h-16 w-16 items-center justify-center rounded-full border-2 border-matcha-400 bg-matcha-500/20 text-xl">
            🟢
          </span>
          <span className="max-w-[90px] truncate text-[11px] font-semibold text-white/80">
            {me?.name ?? "..."}
          </span>
        </div>
        <span className="text-2xl font-extrabold text-white/40">VS</span>
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full border-2 border-white/25 bg-white/5 text-xl">
            ⏳
          </span>
          <span className="text-[11px] font-semibold text-white/60">
            {km ? "កំពុងរង់ចាំ..." : "Waiting..."}
          </span>
        </div>
      </div>
      <p className="max-w-xs text-xs text-white/60">
        {km
          ? "គូប្រកួតស្វ័យប្រវត្តិនឹងចាប់ផ្តើមភ្លាមៗនៅពេលមានអ្នកលេងម្នាក់ទៀត"
          : "Matches automatically the instant another player queues"}
      </p>
      <button
        type="button"
        onClick={onLeave}
        disabled={leaving}
        className="btn-tactile rounded-full bg-white/10 px-5 py-2 text-xs font-bold text-white/80 disabled:opacity-50"
      >
        {km ? "បោះបង់" : "Cancel"}
      </button>
    </div>
  );
}

function HpBar({ card }: { card: BattleRosterCardDTO }) {
  const pct = Math.max(0, Math.round((card.hp / card.maxHp) * 100));
  const tone = pct > 50 ? "from-matcha-400 to-matcha-600" : pct > 20 ? "from-gold-400 to-gold-600" : "from-crimson-500 to-crimson-700";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
      <div
        className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ${tone}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ActiveCreature({
  card,
  km,
  flash,
  mirrored,
}: {
  card: BattleRosterCardDTO;
  km: boolean;
  flash: boolean;
  mirrored?: boolean;
}) {
  const meta = ELEMENTS[card.element];
  return (
    <div className={`flex flex-col items-center gap-1.5 ${mirrored ? "scale-x-[-1]" : ""}`}>
      <div className={`relative h-24 w-24 ${flash ? "animate-battle-hit" : ""} ${card.fainted ? "animate-battle-faint" : "animate-battle-enter"}`}>
        {flash && (
          <span
            className="animate-battle-burst pointer-events-none absolute inset-0 rounded-full blur-md"
            style={{ background: `radial-gradient(circle, ${meta.colors[0]}, transparent 70%)` }}
          />
        )}
        <CreatureCardArt shape={card.shape} element={card.element} className="h-full w-full" />
      </div>
      <div className={`w-28 ${mirrored ? "scale-x-[-1]" : ""}`}>
        <p className="truncate text-center text-[11px] font-extrabold">
          {km ? card.nameKm : card.nameEn} {card.fainted && "💤"}
        </p>
        <HpBar card={card} />
        <p className="mt-0.5 text-center text-[9px] font-bold text-white/60">
          {card.hp}/{card.maxHp} HP · CP {card.power}
        </p>
      </div>
    </div>
  );
}

function BenchStrip({
  roster,
  activeIndex,
  km,
  onPick,
  pickable,
}: {
  roster: BattleRosterCardDTO[];
  activeIndex: number;
  km: boolean;
  onPick?: (index: number) => void;
  pickable?: boolean;
}) {
  return (
    <div className="mt-2 flex justify-center gap-1.5 overflow-x-auto px-1 pb-1">
      {roster.map((c, i) => {
        const isActive = i === activeIndex;
        const disabled = !pickable || isActive || c.fainted;
        return (
          <button
            key={c.cardId}
            type="button"
            disabled={disabled}
            onClick={() => onPick?.(i)}
            title={km ? c.nameKm : c.nameEn}
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-transform ${
              isActive
                ? "border-gold-400 bg-gold-400/20"
                : c.fainted
                  ? "border-white/10 bg-white/5 opacity-40"
                  : pickable
                    ? "border-white/25 bg-white/10 hover:scale-110 hover:border-matcha-400"
                    : "border-white/15 bg-white/5"
            }`}
          >
            <CreatureCardArt shape={c.shape} element={c.element} className="h-7 w-7" />
            {c.fainted && <span className="absolute inset-0 flex items-center justify-center text-[10px]">💤</span>}
          </button>
        );
      })}
    </div>
  );
}

function ArenaView({
  km,
  match,
  me,
  opponent,
  acting,
  flashDefender,
  showSwitcher,
  onToggleSwitcher,
  onAttack,
  onSwitch,
}: {
  km: boolean;
  match: BattleMatchDetailDTO;
  me: BattleMatchDetailDTO["players"][number];
  opponent: BattleMatchDetailDTO["players"][number];
  acting: boolean;
  flashDefender: "me" | "opponent" | null;
  showSwitcher: boolean;
  onToggleSwitcher: () => void;
  onAttack: () => void;
  onSwitch: (index: number) => void;
}) {
  const myActive = me.roster[me.activeIndex];
  const oppActive = opponent.roster[opponent.activeIndex];
  const action = match.lastAction;
  const bannerLabel = action?.type === "ATTACK" ? LABEL_TEXT[action.label] : null;

  return (
    <div>
      {/* Opponent side */}
      <div className="rounded-2xl bg-black/20 p-3">
        <p className="mb-2 truncate text-center text-xs font-bold text-white/70">
          {opponent.name} {match.turnUserId === opponent.userId && `· ${km ? "កំពុងគិត..." : "thinking..."}`}
        </p>
        <div className="flex justify-center">
          <ActiveCreature card={oppActive} km={km} flash={flashDefender === "opponent"} />
        </div>
        <BenchStrip roster={opponent.roster} activeIndex={opponent.activeIndex} km={km} />
      </div>

      {/* Banner */}
      <div className="my-3 flex h-8 items-center justify-center">
        {bannerLabel && (
          <span key={JSON.stringify(action)} className={`animate-battle-banner rounded-full bg-white/10 px-4 py-1 text-xs font-extrabold ${bannerLabel.tone}`}>
            {km ? bannerLabel.km : bannerLabel.en}
            {action?.type === "ATTACK" && <> · {action.damage} DMG</>}
          </span>
        )}
        {!bannerLabel && (
          <span className="text-xs font-bold text-white/50">
            {match.isMyTurn ? (km ? "វេនរបស់អ្នក! ⚔️" : "Your turn! ⚔️") : km ? "វេនរបស់គូប្រកួត" : "Opponent's turn"}
          </span>
        )}
      </div>

      {/* My side */}
      <div className="rounded-2xl bg-black/20 p-3">
        <div className="flex justify-center">
          <ActiveCreature card={myActive} km={km} flash={flashDefender === "me"} mirrored />
        </div>
        <BenchStrip
          roster={me.roster}
          activeIndex={me.activeIndex}
          km={km}
          pickable={showSwitcher && match.isMyTurn}
          onPick={onSwitch}
        />
        <p className="mt-1 truncate text-center text-xs font-bold text-white/70">{me.name} ({km ? "អ្នក" : "You"})</p>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onAttack}
          disabled={!match.isMyTurn || acting || myActive.fainted}
          className="btn-tactile flex items-center gap-1.5 rounded-full bg-gradient-to-r from-crimson-500 to-gold-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Swords size={16} /> {km ? "វាយប្រហារ" : "ATTACK"}
        </button>
        <button
          type="button"
          onClick={onToggleSwitcher}
          disabled={!match.isMyTurn || acting}
          className={`btn-tactile flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-extrabold shadow-lg disabled:cursor-not-allowed disabled:opacity-40 ${
            showSwitcher ? "bg-lavender-500 text-white" : "bg-white/15 text-white"
          }`}
        >
          <Repeat size={16} /> {km ? "ប្តូរ" : "SWITCH"}
        </button>
      </div>
      {showSwitcher && (
        <p className="mt-2 text-center text-[11px] text-white/60">
          {km ? "ចុចជ្រើសរើសសត្វជំនួសនៅជួរខាងក្រោម" : "Tap a bench creature above to switch it in"}
        </p>
      )}
    </div>
  );
}

function ResultScreen({
  km,
  match,
  me,
  opponent,
  onClose,
}: {
  km: boolean;
  match: BattleMatchDetailDTO;
  me: BattleMatchDetailDTO["players"][number] | undefined;
  opponent: BattleMatchDetailDTO["players"][number] | undefined;
  onClose: () => void;
}) {
  const won = match.winnerUserId === match.myUserId;
  if (!me || !opponent) {
    return (
      <div className="py-12 text-center">
        <p className="font-heading text-lg font-extrabold">{won ? "🏆" : "💔"}</p>
        <button
          type="button"
          onClick={onClose}
          className="btn-tactile mt-4 rounded-full bg-white/15 px-5 py-2 text-sm font-bold"
        >
          {km ? "បិទ" : "Close"}
        </button>
      </div>
    );
  }

  // Real, derived-from-state figures -- never fabricated. Damage dealt is
  // simply how much of the opponent's total HP pool I removed.
  const damageDealt = opponent.roster.reduce((s, c) => s + (c.maxHp - c.hp), 0);
  const creaturesDefeated = opponent.roster.filter((c) => c.fainted).length;
  const creaturesLost = me.roster.filter((c) => c.fainted).length;

  return (
    <div className="py-6 text-center">
      {won ? (
        <Trophy size={44} className="mx-auto text-gold-400" />
      ) : (
        <Skull size={44} className="mx-auto text-white/50" />
      )}
      <p className="mt-2 font-heading text-2xl font-extrabold">
        {won ? (km ? "អ្នកឈ្នះ! 🎉" : "VICTORY! 🎉") : km ? "អ្នកចាញ់" : "Defeat"}
      </p>

      <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2.5 text-left">
        <StatCard label={km ? "ការខូចខាតបានធ្វើ" : "Damage Dealt"} value={damageDealt} />
        <StatCard label={km ? "សត្វសម្លាប់បាន" : "Creatures Defeated"} value={creaturesDefeated} />
        <StatCard label={km ? "សត្វរបស់អ្នកបាត់បង់" : "Creatures Lost"} value={creaturesLost} />
        <StatCard
          label={km ? "ពិន្ទុទទួលបាន" : "Diamonds Earned"}
          value={`+${won ? WIN_REWARD_POINTS : LOSS_REWARD_POINTS}`}
          accent="text-clay-500"
        />
      </div>

      <p className="mt-3 text-xs font-semibold text-white/60">
        {km
          ? `រាល់សត្វក្នុងកញ្ចប់ទទួលបាន +${won ? WIN_EXP_PER_CARD : LOSS_EXP_PER_CARD} EXP`
          : `Every deck creature gained +${won ? WIN_EXP_PER_CARD : LOSS_EXP_PER_CARD} EXP`}
      </p>

      <div className="mt-5 flex justify-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="btn-tactile rounded-full bg-white/15 px-5 py-2.5 text-sm font-bold"
        >
          {km ? "បិទ" : "Close"}
        </button>
        <Link
          href="/collection"
          onClick={onClose}
          className="btn-tactile rounded-full bg-gradient-to-r from-lavender-500 to-crimson-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg"
        >
          {km ? "មើលបណ្តុំសត្វ" : "View Collection"}
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">{label}</p>
      <p className={`text-lg font-extrabold ${accent ?? "text-white"}`}>{value}</p>
    </div>
  );
}
