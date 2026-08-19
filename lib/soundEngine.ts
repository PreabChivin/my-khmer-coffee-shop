/**
 * 🔊 Arcade sound engine — tiny Web Audio API synth, no audio files.
 *
 * Deliberately generates every effect from oscillators at runtime rather
 * than shipping .mp3/.wav assets: this project has repeatedly hit the
 * "no real assets have been sourced" wall (see the avatar-art history), and
 * synthesised blips need zero sourcing, zero licensing, and add zero bytes
 * to the bundle.
 *
 * Browsers refuse to start an AudioContext before a user gesture, so the
 * context is created lazily on the first playSound() call (which is always
 * downstream of a click/tap) and resumed if the browser suspended it.
 * Every call is best-effort: audio must never break a real interaction.
 */

export type SoundName =
  | "click"
  | "match"
  | "claim"
  | "correct"
  | "wrong"
  | "spin"
  | "pack"
  | "reveal"
  | "legendary"
  | "upgrade";

const STORAGE_KEY = "arcade-sound-muted";

interface Tone {
  /** Hz. */
  freq: number;
  /** Seconds from the start of the effect. */
  at: number;
  /** Seconds. */
  dur: number;
  type: OscillatorType;
  gain: number;
}

// Short, soft, non-annoying — these fire often, so peak gain stays low.
const SOUNDS: Record<SoundName, Tone[]> = {
  click: [{ freq: 660, at: 0, dur: 0.06, type: "triangle", gain: 0.05 }],
  match: [
    { freq: 523, at: 0, dur: 0.1, type: "sine", gain: 0.07 },
    { freq: 784, at: 0.1, dur: 0.14, type: "sine", gain: 0.07 },
  ],
  claim: [
    { freq: 659, at: 0, dur: 0.09, type: "triangle", gain: 0.06 },
    { freq: 880, at: 0.09, dur: 0.09, type: "triangle", gain: 0.06 },
    { freq: 1175, at: 0.18, dur: 0.16, type: "triangle", gain: 0.06 },
  ],
  correct: [
    { freq: 784, at: 0, dur: 0.08, type: "sine", gain: 0.07 },
    { freq: 1047, at: 0.08, dur: 0.16, type: "sine", gain: 0.07 },
  ],
  wrong: [
    { freq: 233, at: 0, dur: 0.14, type: "sawtooth", gain: 0.04 },
    { freq: 175, at: 0.12, dur: 0.18, type: "sawtooth", gain: 0.04 },
  ],
  // 🃏 Card collector cues
  pack: [
    { freq: 180, at: 0, dur: 0.18, type: "sawtooth", gain: 0.04 },
    { freq: 140, at: 0.14, dur: 0.2, type: "sawtooth", gain: 0.035 },
  ],
  reveal: [
    { freq: 880, at: 0, dur: 0.07, type: "sine", gain: 0.05 },
    { freq: 1175, at: 0.06, dur: 0.1, type: "sine", gain: 0.05 },
  ],
  legendary: [
    { freq: 523, at: 0, dur: 0.1, type: "triangle", gain: 0.07 },
    { freq: 784, at: 0.1, dur: 0.1, type: "triangle", gain: 0.07 },
    { freq: 1047, at: 0.2, dur: 0.12, type: "triangle", gain: 0.075 },
    { freq: 1568, at: 0.32, dur: 0.28, type: "triangle", gain: 0.08 },
  ],
  upgrade: [
    { freq: 440, at: 0, dur: 0.09, type: "sine", gain: 0.06 },
    { freq: 660, at: 0.09, dur: 0.09, type: "sine", gain: 0.06 },
    { freq: 990, at: 0.18, dur: 0.18, type: "sine", gain: 0.065 },
  ],
  spin: [
    { freq: 392, at: 0, dur: 0.07, type: "square", gain: 0.03 },
    { freq: 523, at: 0.07, dur: 0.07, type: "square", gain: 0.03 },
    { freq: 659, at: 0.14, dur: 0.07, type: "square", gain: 0.03 },
    { freq: 880, at: 0.21, dur: 0.12, type: "square", gain: 0.04 },
  ],
};

let ctx: AudioContext | null = null;
let muted = false;
let hydrated = false;
const listeners = new Set<(muted: boolean) => void>();

/** Reads the persisted preference once, lazily (never during SSR). */
function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // private mode / storage disabled — default to unmuted
  }
}

export function isSoundMuted(): boolean {
  hydrate();
  return muted;
}

export function setSoundMuted(next: boolean): void {
  hydrate();
  muted = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn(next));
  if (!next) playSound("click");
}

/** Subscribe to mute changes so every mounted toggle stays in sync. */
export function subscribeSoundMuted(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function playSound(name: SoundName): void {
  hydrate();
  if (muted) return;
  const audio = getContext();
  if (!audio) return;

  try {
    const now = audio.currentTime;
    for (const tone of SOUNDS[name]) {
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = tone.type;
      osc.frequency.setValueAtTime(tone.freq, now + tone.at);
      // Quick attack, exponential decay — an abrupt stop would click.
      amp.gain.setValueAtTime(0.0001, now + tone.at);
      amp.gain.exponentialRampToValueAtTime(tone.gain, now + tone.at + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + tone.at + tone.dur);
      osc.connect(amp);
      amp.connect(audio.destination);
      osc.start(now + tone.at);
      osc.stop(now + tone.at + tone.dur + 0.02);
    }
  } catch {
    // best-effort — never break the interaction that triggered it
  }
}
