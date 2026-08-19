"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Trophy } from "lucide-react";
import Confetti from "@/components/Confetti";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { QUESTION_DURATION_MS } from "@/lib/quizEngine";
import { playSound } from "@/lib/soundEngine";
import type { QuizMatchDetailDTO, QuizPlayerDTO } from "@/lib/types";

const POLL_MS = 1500;
const TICK_MS = 250;
const COUNTDOWN_FROM = 3;
const CHOICE_LABELS = ["A", "B", "C", "D"];
const MEDAL = ["🥇", "🥈", "🥉"];

/**
 * 🧠 Trivia Quiz Show — direct "PLAY NOW" entry point, no chat invite.
 * Opens straight into a waiting room (create-or-join via
 * POST /api/quiz/quick-match), shows a live [n/capacity] slot visualizer
 * while waiting, auto-starts the instant the room fills (or any player can
 * start early once >=2 have joined — see the start route's doc comment for
 * why, given there's no AI-bot filler), a 3-2-1 countdown, then the real
 * question loop: server-timed countdown, four choices, live scoreboard,
 * and a final podium with real loyaltyPoints rewards. Same polling
 * architecture as every other "live" feature in this app.
 */
export default function QuizLobbyModal({ onClose }: { onClose: () => void }) {
  const { user, refresh } = useSession();
  const { lang } = useLanguage();
  const km = lang === "km";

  const [match, setMatch] = useState<QuizMatchDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const wasWaitingRef = useRef(false);
  const timeoutFiredForIndexRef = useRef<number | null>(null);
  const celebratedForIndexRef = useRef<number | null>(null);
  const rewardsAppliedRef = useRef(false);

  // 1️⃣ Enter the room: create-or-instantly-join.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/quiz/quick-match", { method: "POST" })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? (km ? "មិនអាចចូលរួមបានទេ។" : "Couldn't join a room."));
          return;
        }
        setMatch(data as QuizMatchDetailDTO);
      })
      .catch(() => {
        if (!cancelled) setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2️⃣ Poll for room/match updates whenever we have a live room.
  useEffect(() => {
    if (!match || match.status === "COMPLETED" || match.status === "CANCELLED") return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/quiz/${match.id}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as QuizMatchDetailDTO;
        if (!cancelled) setMatch(data);
      } catch {
        // transient — next tick retries
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // Deliberately NOT depending on the full `match` object — it gets a
    // new reference every poll tick, which would tear down and restart
    // this interval on every single response instead of just once per room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id, match?.status]);

  // 3️⃣ WAITING → ACTIVE: run a 3-2-1 countdown before the first question.
  useEffect(() => {
    if (match?.status === "WAITING") wasWaitingRef.current = true;
    if (match?.status === "ACTIVE" && wasWaitingRef.current) {
      wasWaitingRef.current = false;
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

  // 4️⃣ Local 250ms ticker — drives the countdown bar and fires the
  // belt-and-suspenders timeout call once per question when time's up.
  useEffect(() => {
    if (match?.status !== "ACTIVE") return;
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, [match?.status]);

  useEffect(() => {
    if (!match?.question || !match.questionDeadlineAt) return;
    const remaining = new Date(match.questionDeadlineAt).getTime() - now;
    if (remaining <= 0 && timeoutFiredForIndexRef.current !== match.question.index) {
      timeoutFiredForIndexRef.current = match.question.index;
      fetch(`/api/quiz/${match.id}/timeout`, { method: "POST" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && setMatch(data as QuizMatchDetailDTO))
        .catch(() => {});
    }
  }, [now, match]);

  // 🔊 One result chime per question, the moment my own answer is revealed.
  // Sound only — playSound talks to an external system, which is what an
  // effect is for; the confetti is derived in render instead (below).
  useEffect(() => {
    if (!match?.question || match.question.correctIndex === null) return;
    if (celebratedForIndexRef.current === match.question.index) return;
    celebratedForIndexRef.current = match.question.index;
    playSound(match.question.myChoice === match.question.correctIndex ? "correct" : "wrong");
  }, [match?.question]);

  // 💎 Refresh the header points pill once the podium (and its rewards)
  // land, so the balance updates without a manual reload.
  useEffect(() => {
    if (match?.status === "COMPLETED" && !rewardsAppliedRef.current) {
      rewardsAppliedRef.current = true;
      refresh();
    }
  }, [match?.status, refresh]);

  async function startNow() {
    if (!match) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${match.id}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (km ? "មិនអាចចាប់ផ្តើមបានទេ។" : "Couldn't start."));
        return;
      }
      setMatch(data as QuizMatchDetailDTO);
    } catch {
      setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
    } finally {
      setStarting(false);
    }
  }

  async function leaveRoom() {
    if (!match) {
      onClose();
      return;
    }
    setLeaving(true);
    try {
      await fetch(`/api/quiz/${match.id}/leave`, { method: "POST" });
    } catch {
      // best-effort
    } finally {
      onClose();
    }
  }

  async function answer(choiceIndex: number) {
    if (!match?.question || submitting || match.question.myChoice !== null) return;
    playSound("click");
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${match.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choiceIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (km ? "មិនអាចឆ្លើយបានទេ។" : "Couldn't submit."));
        return;
      }
      setMatch(data as QuizMatchDetailDTO);
    } catch {
      setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  // Derived, not stored: true only while my own answer for the current
  // question is revealed AND correct. A new question changes the Confetti
  // key, which remounts it for a fresh burst; it removes itself when done.
  const currentQ = match?.question ?? null;
  const gotCurrentQuestionRight =
    currentQ !== null &&
    currentQ.correctIndex !== null &&
    currentQ.myChoice === currentQ.correctIndex;

  if (!user) return null;

  const me = match?.players.find((p) => p.id === user.id) ?? null;
  const remainingMs = match?.questionDeadlineAt
    ? Math.max(0, new Date(match.questionDeadlineAt).getTime() - now)
    : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const barPercent = Math.max(0, Math.min(100, (remainingMs / QUESTION_DURATION_MS) * 100));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-coffee-900/85 p-4 backdrop-blur-md">
      {gotCurrentQuestionRight && currentQ && (
        <Confetti key={`quiz-correct-${currentQ.index}`} />
      )}
      <div className="khmer-card relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-coffee-900 to-lavender-900 text-white shadow-2xl">
        <button
          type="button"
          onClick={leaveRoom}
          aria-label="Close"
          disabled={leaving}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform hover:scale-110 hover:bg-white/20 active:scale-95"
        >
          <X size={16} />
        </button>

        <div className="flex items-center justify-center gap-2 px-6 pt-6">
          <span className="text-2xl">🧠</span>
          <p className="font-heading text-lg font-extrabold">
            {km ? "ការប្រកួតសំណួរ" : "Trivia Quiz Show"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-3">
          {error && (
            <p className="mb-3 rounded-full bg-crimson-600/90 px-3 py-1.5 text-center text-xs font-semibold text-white">
              {error}
            </p>
          )}

          {!match ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 size={28} className="animate-spin text-white/70" />
              <p className="text-sm text-white/70">{km ? "កំពុងរកបន្ទប់..." : "Finding a room..."}</p>
            </div>
          ) : countdown !== null ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm font-bold text-matcha-300">
                {km ? "អ្នកលេងគ្រប់ហើយ! ចាប់ផ្តើម..." : "Room ready! Starting..."}
              </p>
              <span className="animate-pop-in text-7xl font-extrabold drop-shadow-lg">
                {countdown === 0 ? "🧠" : countdown}
              </span>
            </div>
          ) : match.status === "WAITING" ? (
            <WaitingRoom match={match} km={km} onStart={startNow} starting={starting} />
          ) : match.status === "ACTIVE" && match.question ? (
            <QuestionView
              match={match}
              km={km}
              remainingSec={remainingSec}
              barPercent={barPercent}
              submitting={submitting}
              onAnswer={answer}
            />
          ) : match.status === "COMPLETED" && match.podium ? (
            <Podium podium={match.podium} me={me} km={km} onClose={onClose} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 size={28} className="animate-spin text-white/70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitingRoom({
  match,
  km,
  onStart,
  starting,
}: {
  match: QuizMatchDetailDTO;
  km: boolean;
  onStart: () => void;
  starting: boolean;
}) {
  const filled = match.players.length;
  const slots = Array.from({ length: match.capacity }, (_, i) => match.players[i] ?? null);

  return (
    <div>
      <p className="rounded-full bg-white/10 px-4 py-1.5 text-center text-xs font-bold">
        {km ? `រង់ចាំអ្នកលេង [${filled}/${match.capacity}]` : `Waiting for players [${filled}/${match.capacity}]`}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-extrabold ${
                p ? "animate-stage-glow border-matcha-400 bg-matcha-500/20" : "animate-pulse border-white/25 bg-white/5"
              }`}
            >
              {p ? "🟢" : "⏳"}
            </span>
            <span className="max-w-[70px] truncate text-[10px] font-semibold text-white/80">
              {p ? p.name : km ? "ទំនេរ" : "Open"}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-white/60">
        {km
          ? "បន្ទប់នឹងចាប់ផ្តើមស្វ័យប្រវត្តិនៅពេលពេញ ឬចុចចាប់ផ្តើមឥឡូវ"
          : "The room auto-starts once full, or start early below"}
      </p>

      <button
        type="button"
        onClick={onStart}
        disabled={starting || filled < 2}
        className="btn-tactile mt-4 w-full rounded-full bg-gradient-to-r from-accent to-accent-hover py-3 text-sm font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        {starting
          ? km
            ? "កំពុងចាប់ផ្តើម..."
            : "Starting..."
          : filled < 2
            ? km
              ? "ត្រូវការអ្នកលេងយ៉ាងតិច ២ នាក់"
              : "Need at least 2 players"
            : km
              ? "ចាប់ផ្តើមឥឡូវ 🚀"
              : "Start Now 🚀"}
      </button>
    </div>
  );
}

function QuestionView({
  match,
  km,
  remainingSec,
  barPercent,
  submitting,
  onAnswer,
}: {
  match: QuizMatchDetailDTO;
  km: boolean;
  remainingSec: number;
  barPercent: number;
  submitting: boolean;
  onAnswer: (choice: number) => void;
}) {
  const q = match.question!;
  const answered = q.myChoice !== null;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-white/70">
        <span>
          {km ? "សំណួរទី" : "Question"} {q.index + 1}/{q.totalQuestions}
        </span>
        <span className={remainingSec <= 3 ? "text-crimson-400" : ""}>⏱️ {remainingSec}s</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
            remainingSec <= 3 ? "bg-crimson-400" : "bg-matcha-400"
          }`}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-lavender-300">
        {q.category}
      </p>
      <p className="mt-1 font-heading text-base font-extrabold leading-snug">{q.textKm}</p>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {q.choicesKm.map((choice, i) => {
          const isMine = q.myChoice === i;
          const isCorrect = q.correctIndex === i;
          const revealed = q.correctIndex !== null;
          let tone =
            "border-white/20 bg-white/5 hover:border-lavender-400 hover:bg-white/10 active:scale-95";
          if (revealed && isCorrect) tone = "border-matcha-400 bg-matcha-500/25";
          else if (revealed && isMine && !isCorrect) tone = "border-crimson-400 bg-crimson-500/25";
          else if (isMine) tone = "border-lavender-400 bg-lavender-500/25";

          return (
            <button
              key={i}
              type="button"
              onClick={() => onAnswer(i)}
              disabled={answered || submitting}
              className={`flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-3 text-left text-sm font-semibold transition-all disabled:cursor-not-allowed ${tone}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-extrabold">
                {CHOICE_LABELS[i]}
              </span>
              <span className="min-w-0 flex-1">{choice}</span>
              {revealed && isCorrect && <span>✅</span>}
              {revealed && isMine && !isCorrect && <span>❌</span>}
            </button>
          );
        })}
      </div>

      {answered && q.correctIndex === null && (
        <p className="mt-3 text-center text-xs text-white/60">
          {km ? "រង់ចាំអ្នកលេងផ្សេងទៀត... ⏳" : "Waiting for other players... ⏳"}
        </p>
      )}

      <ScoreStrip players={match.players} km={km} myId={match.myUserId} />
    </div>
  );
}

function ScoreStrip({ players, km, myId }: { players: QuizPlayerDTO[]; km: boolean; myId: string }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="mt-5 border-t border-white/10 pt-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
        {km ? "ពិន្ទុបច្ចុប្បន្ន" : "Live Scores"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ranked.map((p) => (
          <span
            key={p.id}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              p.id === myId ? "bg-lavender-500/30 text-lavender-100" : "bg-white/10 text-white/80"
            }`}
          >
            {p.hasAnsweredCurrent ? "✅" : "⏳"} {p.name}: {p.score}
          </span>
        ))}
      </div>
    </div>
  );
}

function Podium({
  podium,
  me,
  km,
  onClose,
}: {
  podium: QuizPlayerDTO[];
  me: QuizPlayerDTO | null;
  km: boolean;
  onClose: () => void;
}) {
  const top3 = podium.slice(0, 3);
  const rest = podium.slice(3);

  return (
    <div className="py-2 text-center">
      <p className="font-heading text-lg font-extrabold">
        {km ? "លទ្ធផលចុងក្រោយ! 🏆" : "Final Results! 🏆"}
      </p>

      <div className="mt-5 flex items-end justify-center gap-3">
        {top3.map((p, i) => (
          <div key={p.id} className="flex flex-col items-center gap-1">
            <span className="text-3xl">{MEDAL[i]}</span>
            <span
              className={`flex items-center justify-center rounded-2xl bg-white/10 px-3 font-extrabold ${
                i === 0 ? "h-24 w-20 text-base" : i === 1 ? "h-18 w-16 text-sm" : "h-14 w-16 text-sm"
              }`}
              style={{ height: i === 0 ? 96 : i === 1 ? 72 : 56 }}
            >
              {p.score}
            </span>
            <span className="max-w-[72px] truncate text-[11px] font-semibold text-white/80">{p.name}</span>
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="mx-auto mt-4 flex max-w-xs flex-wrap justify-center gap-1.5">
          {rest.map((p, i) => (
            <span key={p.id} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">
              #{i + 4} {p.name} — {p.score}
            </span>
          ))}
        </div>
      )}

      {me && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold text-gold-300">
          <Trophy size={14} /> {km ? "អ្នកទទួលបានពិន្ទុរង្វាន់!" : "You earned reward points!"}
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="btn-tactile mt-5 w-full rounded-full bg-gradient-to-r from-lavender-500 to-crimson-500 py-3 text-sm font-bold text-white shadow-lg"
      >
        {km ? "បិទ" : "Close"}
      </button>
    </div>
  );
}
