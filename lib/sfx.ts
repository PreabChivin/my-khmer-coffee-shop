"use client";

/**
 * 🔊 Ultra-cute, dependency-free sound effects via the Web Audio API — no audio
 * assets to ship. Each call is a tiny synthesized blip. All are best-effort and
 * fail silently where Web Audio is unavailable or autoplay is blocked.
 *
 * A single shared AudioContext is lazily created on first user interaction (the
 * only time browsers allow it to start).
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(
  freqStart: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType = "sine",
  gainPeak = 0.18
) {
  const audio = getCtx();
  if (!audio) return;
  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch {
    // ignore
  }
}

/** A soft rising "pop" — for adding to cart. */
export function playPop() {
  blip(420, 900, 0.14, "sine", 0.2);
}

/** A quick bubbly "blop" — for toggles / option taps. */
export function playBubble() {
  blip(650, 320, 0.12, "triangle", 0.14);
}

/** A tiny tick — for small selections. */
export function playTick() {
  blip(880, 880, 0.05, "square", 0.06);
}

/** A cheerful two-note rise — for winning a wheel prize / success. */
export function playWin() {
  blip(660, 990, 0.14, "sine", 0.2);
  window.setTimeout(() => blip(990, 1320, 0.2, "sine", 0.2), 120);
}

/** A whooshy descending sweep — for the wheel spinning. */
export function playSpin() {
  blip(1200, 200, 0.6, "sawtooth", 0.1);
}
