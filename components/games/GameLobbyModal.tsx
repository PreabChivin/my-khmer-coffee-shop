"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import ChatGameOverlay from "@/components/game/ChatGameOverlay";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/soundEngine";
import type { GameDetailDTO, GameType } from "@/lib/types";

const POLL_MS = 1500;
const COUNTDOWN_FROM = 3;

const GAME_LABEL: Record<GameType, { km: string; en: string }> = {
  TICTACTOE: { km: "អុក-តុក-តេ", en: "Tic-Tac-Toe" },
  RPS: { km: "កូន-ក្រដាស-កន្ត្រៃ", en: "Rock-Paper-Scissors" },
};

/**
 * 🚪 Direct "PLAY NOW" entry point — no manual chat invite. Opens straight
 * into a waiting room: creates or instantly joins a match via
 * POST /api/games/quick-match, shows a live [1/2] capacity header + slot
 * visualizer while waiting (polling the same GET /api/chat/games/[id] the
 * chat drawer already uses), then a 3-2-1 countdown the moment a second
 * player is seated, and finally hands off to the existing ChatGameOverlay
 * for real gameplay — no new move/win logic, just a new front door onto the
 * already-live game engine.
 */
export default function GameLobbyModal({
  gameType,
  onClose,
}: {
  gameType: GameType;
  onClose: () => void;
}) {
  const { user } = useSession();
  const { lang } = useLanguage();
  const km = lang === "km";
  const label = km ? GAME_LABEL[gameType].km : GAME_LABEL[gameType].en;

  const [game, setGame] = useState<GameDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const wasPendingRef = useRef(false);

  // 1️⃣ Enter the lobby: create-or-instantly-join.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/games/quick-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? (km ? "មិនអាចរកគូប្រកួតបានទេ។" : "Couldn't find a match."));
          return;
        }
        setGame(data as GameDetailDTO);
      })
      .catch(() => {
        if (!cancelled) setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameType, user]);

  // 2️⃣ While waiting (PENDING), poll for someone else to join.
  useEffect(() => {
    if (!game || game.status !== "PENDING") return;
    wasPendingRef.current = true;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/games/${game.id}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as GameDetailDTO;
        if (!cancelled) setGame(data);
      } catch {
        // transient — next tick retries
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [game]);

  // 3️⃣ The instant the room fills (PENDING → ACTIVE), run a 3-2-1 countdown
  // before revealing the board — a beat of anticipation, not just a snap cut.
  useEffect(() => {
    if (game?.status === "ACTIVE" && wasPendingRef.current) {
      wasPendingRef.current = false;
      playSound("match");
      setCountdown(COUNTDOWN_FROM);
    }
  }, [game?.status]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      const t = setTimeout(() => setCountdown(null), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 800);
    return () => clearTimeout(t);
  }, [countdown]);

  async function cancelWaiting() {
    if (!game) return;
    setCancelling(true);
    try {
      await fetch(`/api/chat/games/${game.id}/cancel`, { method: "POST" });
    } catch {
      // best-effort — close the lobby regardless
    } finally {
      onClose();
    }
  }

  if (!user) return null;

  // Handed off to real gameplay — countdown finished and the board is live.
  // Pass along the game state we already have so the board renders
  // immediately playable instead of sitting disabled through its own first
  // poll (see ChatGameOverlay's initialGame doc comment).
  if (game && game.status === "ACTIVE" && countdown === null) {
    return (
      <ChatGameOverlayModal gameId={game.id} myUserId={user.id} onClose={onClose} initialGame={game} />
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-coffee-900/80 p-4 backdrop-blur-md">
      <div className="khmer-card relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-coffee-900 to-lavender-900 p-6 text-center text-white shadow-2xl">
        <button
          type="button"
          onClick={game?.status === "PENDING" ? cancelWaiting : onClose}
          aria-label="Close"
          disabled={cancelling}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform hover:scale-110 hover:bg-white/20 active:scale-95"
        >
          <X size={16} />
        </button>

        <p className="font-heading text-lg font-extrabold">{label}</p>

        {error ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-crimson-300">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="btn-tactile mt-4 rounded-full bg-white/15 px-5 py-2 text-sm font-bold"
            >
              {km ? "បិទ" : "Close"}
            </button>
          </div>
        ) : countdown !== null ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm font-bold text-matcha-300">
              {km ? "អ្នកលេងគ្រប់ហើយ! ចាប់ផ្តើម..." : "Room full! Starting..."}
            </p>
            <span className="animate-pop-in text-7xl font-extrabold drop-shadow-lg">
              {countdown === 0 ? "🎮" : countdown}
            </span>
          </div>
        ) : !game ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-white/70" />
            <p className="text-sm text-white/70">{km ? "កំពុងរកគូប្រកួត..." : "Finding a match..."}</p>
          </div>
        ) : (
          <WaitingRoom game={game} km={km} onCancel={cancelWaiting} cancelling={cancelling} />
        )}
      </div>
    </div>
  );
}

function WaitingRoom({
  game,
  km,
  onCancel,
  cancelling,
}: {
  game: GameDetailDTO;
  km: boolean;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const filled = game.player2 ? 2 : 1;

  return (
    <div className="mt-2">
      <p className="mt-1 rounded-full bg-white/10 px-4 py-1 text-xs font-bold">
        {km ? `រង់ចាំអ្នកលេង [${filled}/2]` : `Waiting for players [${filled}/2]`}
      </p>

      <div className="mt-6 flex items-center justify-center gap-4">
        <SlotAvatar name={game.player1.name} ready km={km} />
        <span className="text-2xl font-extrabold text-white/40">VS</span>
        <SlotAvatar name={game.player2?.name ?? null} ready={Boolean(game.player2)} km={km} />
      </div>

      <p className="mt-6 text-xs text-white/60">
        {km
          ? "កំពុងស្វែងរកអ្នកលេងផ្សេងទៀតដោយស្វ័យប្រវត្តិ..."
          : "Automatically matching you with the next player to hit Play Now..."}
      </p>

      <button
        type="button"
        onClick={onCancel}
        disabled={cancelling}
        className="btn-tactile mt-5 rounded-full bg-white/10 px-5 py-2 text-xs font-bold text-white/80 disabled:opacity-50"
      >
        {km ? "បោះបង់" : "Cancel"}
      </button>
    </div>
  );
}

function SlotAvatar({ name, ready, km }: { name: string | null; ready: boolean; km: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl font-extrabold ${
          ready
            ? "animate-stage-glow border-matcha-400 bg-matcha-500/20"
            : "animate-pulse border-white/25 bg-white/5"
        }`}
      >
        {ready ? "🟢" : "⏳"}
      </span>
      <span className="max-w-[80px] truncate text-[11px] font-semibold text-white/80">
        {ready ? name : km ? "កំពុងរង់ចាំ..." : "Waiting..."}
      </span>
    </div>
  );
}

/** Wraps the existing chat-drawer game overlay in a standalone full-screen
 *  modal (it normally renders absolutely inside the drawer's own frame). */
function ChatGameOverlayModal({
  gameId,
  myUserId,
  onClose,
  initialGame,
}: {
  gameId: string;
  myUserId: string;
  onClose: () => void;
  initialGame?: GameDetailDTO;
}) {
  return (
    <div className="fixed inset-0 z-[70]">
      <ChatGameOverlay gameId={gameId} myUserId={myUserId} onClose={onClose} initialGame={initialGame} />
    </div>
  );
}
