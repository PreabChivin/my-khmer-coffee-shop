"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import Confetti from "@/components/Confetti";
import type { GameDetailDTO } from "@/lib/types";

const POLL_INTERVAL_MS = 1500;

/**
 * 🎮 Tic-Tac-Toe board overlay — a bottom-sheet inside the chat drawer. Polls
 * the game state every 1.5s (faster than the chat's 2.5s, since turns want to
 * feel snappy) and only polls while the game is still live. Turn validation is
 * server-authoritative; the client just disables cells that aren't legal for
 * the local player, so a tap out of turn never even fires a request.
 */
export default function ChatGameOverlay({
  gameId,
  myUserId,
  onClose,
}: {
  gameId: string;
  myUserId: string;
  onClose: () => void;
}) {
  const [game, setGame] = useState<GameDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingCell, setPendingCell] = useState<number | null>(null);
  const celebratedRef = useRef(false);
  const [celebrate, setCelebrate] = useState(false);

  const isOver = game?.status === "COMPLETED";
  const iWon = isOver && game?.winnerId === myUserId;

  // 🔁 Poll the board while it's live; stop once the match ends.
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const res = await fetch(`/api/chat/games/${gameId}`);
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error ?? "មិនអាចផ្ទុកការលេងបានទេ។");
          return;
        }
        const data = (await res.json()) as GameDetailDTO;
        if (cancelled) return;
        setGame(data);
        if (data.status === "COMPLETED" && interval) {
          clearInterval(interval);
          interval = null;
        }
      } catch {
        // transient — next tick retries
      }
    }

    poll();
    interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [gameId]);

  // Fire confetti once, only if *I* won.
  useEffect(() => {
    if (iWon && !celebratedRef.current) {
      celebratedRef.current = true;
      setCelebrate(true);
    }
  }, [iWon]);

  async function play(cell: number) {
    if (!game || game.status !== "ACTIVE") return;
    if (game.currentTurnPlayerId !== myUserId) return;
    if (game.board[cell] !== null) return;
    setPendingCell(cell);
    setError(null);
    try {
      const res = await fetch(`/api/chat/games/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cell }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "មិនអាចលេងបានទេ។");
        return;
      }
      setGame(data as GameDetailDTO);
    } catch {
      setError("បណ្តាញមានបញ្ហា សូមព្យាយាមម្តងទៀត។");
    } finally {
      setPendingCell(null);
    }
  }

  const myTurn = game?.status === "ACTIVE" && game.currentTurnPlayerId === myUserId;
  const opponent =
    game && game.mySlot === "player1" ? game.player2 : game?.player1 ?? null;

  let banner: { text: string; tone: string };
  if (!game) {
    banner = { text: "កំពុងផ្ទុក...", tone: "text-coffee-500 dark:text-cream-300" };
  } else if (game.status === "ACTIVE") {
    banner = myTurn
      ? { text: "វេនរបស់អ្នក! 🔥", tone: "text-matcha-600 dark:text-matcha-400" }
      : { text: "វេនរបស់គូប្រកួត... ⏳", tone: "text-coffee-500 dark:text-cream-300" };
  } else if (game.isTie) {
    banner = { text: "ស្មើគ្នា! 🤝", tone: "text-gold-600 dark:text-gold-400" };
  } else if (iWon) {
    banner = { text: "អ្នកឈ្នះហើយ! 🎉", tone: "text-matcha-600 dark:text-matcha-400" };
  } else {
    banner = { text: "អ្នកចាញ់ហើយ 😭", tone: "text-crimson-600 dark:text-crimson-400" };
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gradient-to-b from-coffee-900/95 to-lavender-500/30 backdrop-blur-md">
      {celebrate && <Confetti />}

      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="font-heading text-base">Tic-Tac-Toe 🎮</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close game"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform hover:scale-110 hover:bg-white/25 active:scale-95"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
        {/* Players */}
        {game && (
          <div className="flex items-center gap-3 text-sm text-white">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold">
              {game.player1.mark} {game.player1.name}
              {game.mySlot === "player1" && <span className="text-[10px] opacity-80">(អ្នក)</span>}
            </span>
            <span className="text-white/60">vs</span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold">
              {game.player2 ? `${game.player2.mark} ${game.player2.name}` : "..."}
              {game.mySlot === "player2" && <span className="text-[10px] opacity-80">(អ្នក)</span>}
            </span>
          </div>
        )}

        {/* Turn / result banner */}
        <p className={`rounded-full bg-cream-50/95 px-5 py-2 text-base font-extrabold shadow-lg ${banner.tone}`}>
          {banner.text}
        </p>

        {/* Board — neon glowing grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {(game?.board ?? Array(9).fill(null)).map((mark, cell) => {
            const playable = myTurn && mark === null && pendingCell === null;
            return (
              <button
                key={cell}
                type="button"
                onClick={() => play(cell)}
                disabled={!playable}
                className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl transition-all duration-150 sm:h-24 sm:w-24 ${
                  mark
                    ? "animate-pop-in border-lavender-400 bg-coffee-900/70 shadow-[0_0_18px_-2px_rgba(154,130,234,0.9)]"
                    : playable
                      ? "border-matcha-400 bg-coffee-900/40 shadow-[0_0_14px_-4px_rgba(127,209,174,0.9)] hover:scale-105 hover:bg-coffee-900/60 active:scale-95"
                      : "border-white/20 bg-coffee-900/30"
                }`}
              >
                {pendingCell === cell ? (
                  <Loader2 size={24} className="animate-spin text-white/70" />
                ) : (
                  mark
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="rounded-full bg-crimson-600/90 px-3 py-1 text-xs font-semibold text-white">
            {error}
          </p>
        )}

        {isOver && (
          <button
            type="button"
            onClick={onClose}
            className="mt-1 rounded-full bg-gradient-to-r from-lavender-500 to-crimson-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            ត្រឡប់ទៅការជជែក
          </button>
        )}

        {opponent && game?.status === "ACTIVE" && (
          <p className="text-[11px] text-white/60">កំពុងលេងជាមួយ {opponent.name}</p>
        )}
      </div>
    </div>
  );
}
