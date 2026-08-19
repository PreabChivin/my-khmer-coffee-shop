"use client";

import { ELEMENTS, type Element } from "@/lib/creatures";

/**
 * 🎨 Procedural creature art — inline SVG built from the species' body
 * shape + its element gradient, so every creature is drawn at runtime with
 * no image assets at all.
 *
 * This is a deliberate, stated ceiling rather than a placeholder: there is
 * no image-generation tool in this environment and no illustrated creature
 * pack has been sourced, so promising "high-res artwork" would have meant
 * shipping broken <img> tags. Geometric-but-styled vector art always
 * renders, scales to any size, themes itself off the element palette, and
 * costs zero bytes. Swapping in real illustration later means changing only
 * this component.
 */

interface Props {
  shape: string;
  element: Element;
  isShiny?: boolean;
  className?: string;
}

/** Eyes shared by every shape — the single biggest "it reads as a creature"
 *  cue, so they are drawn consistently rather than per-shape. */
function Eyes({ cx1, cx2, cy, r = 4 }: { cx1: number; cx2: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx1} cy={cy} r={r} fill="#1b1023" />
      <circle cx={cx2} cy={cy} r={r} fill="#1b1023" />
      <circle cx={cx1 + r * 0.35} cy={cy - r * 0.35} r={r * 0.35} fill="#fff" />
      <circle cx={cx2 + r * 0.35} cy={cy - r * 0.35} r={r * 0.35} fill="#fff" />
    </g>
  );
}

function Body({ shape, fill }: { shape: string; fill: string }) {
  switch (shape) {
    case "wyrm":
      return (
        <g fill={fill}>
          {/* coiled serpent body */}
          <path d="M50 88c-16 0-26-10-26-22 0-13 10-22 24-22 10 0 16 5 16 12 0 6-4 10-10 10-4 0-7-2-7-6h9c0-6-4-9-9-9-8 0-13 6-13 15 0 10 8 17 19 17 14 0 23-10 23-24 0-17-13-29-31-29V18c23 0 39 16 39 37 0 19-13 33-34 33z" />
          {/* wings */}
          <path d="M70 34c8-9 18-12 24-9-3 7-10 14-19 17z" opacity="0.85" />
          <path d="M30 34c-8-9-18-12-24-9 3 7 10 14 19 17z" opacity="0.85" />
        </g>
      );
    case "avian":
      return (
        <g fill={fill}>
          <ellipse cx="50" cy="58" rx="20" ry="24" />
          <circle cx="50" cy="32" r="15" />
          {/* wings */}
          <path d="M30 50C16 46 8 54 6 66c12 4 22 0 26-8z" opacity="0.9" />
          <path d="M70 50c14-4 22 4 24 16-12 4-22 0-26-8z" opacity="0.9" />
          {/* crest + tail */}
          <path d="M50 17l6-11 3 12z" />
          <path d="M50 82l-9 14h18z" opacity="0.8" />
        </g>
      );
    case "aquatic":
      return (
        <g fill={fill}>
          <ellipse cx="46" cy="55" rx="26" ry="19" />
          {/* tail fin */}
          <path d="M72 55l20-14v28z" opacity="0.9" />
          {/* dorsal + belly fins */}
          <path d="M42 36l6-14 8 14z" opacity="0.85" />
          <path d="M38 74l4 12 10-11z" opacity="0.7" />
        </g>
      );
    case "bloom":
      return (
        <g fill={fill}>
          {/* petals */}
          <circle cx="50" cy="30" r="12" opacity="0.9" />
          <circle cx="31" cy="43" r="11" opacity="0.9" />
          <circle cx="69" cy="43" r="11" opacity="0.9" />
          {/* bulb body */}
          <ellipse cx="50" cy="62" rx="22" ry="21" />
          {/* leaves */}
          <path d="M28 80c-10-2-16-9-16-17 10-1 18 4 20 12z" opacity="0.8" />
          <path d="M72 80c10-2 16-9 16-17-10-1-18 4-20 12z" opacity="0.8" />
        </g>
      );
    case "spirit":
      return (
        <g fill={fill}>
          <circle cx="50" cy="46" r="24" />
          {/* wisp tail */}
          <path d="M32 66c4 10 12 16 18 16s14-6 18-16c-6 6-12 8-18 8s-12-2-18-8z" opacity="0.85" />
          <path d="M50 84c-3 6-9 9-14 8 4-5 9-7 14-8z" opacity="0.6" />
          <path d="M50 84c3 6 9 9 14 8-4-5-9-7-14-8z" opacity="0.6" />
        </g>
      );
    case "beast":
    default:
      return (
        <g fill={fill}>
          {/* haunches + body */}
          <ellipse cx="50" cy="64" rx="25" ry="21" />
          {/* head */}
          <circle cx="50" cy="36" r="18" />
          {/* ears */}
          <path d="M36 24l-4-14 14 7z" />
          <path d="M64 24l4-14-14 7z" />
          {/* tail */}
          <path d="M74 70c10 2 16 8 16 16-9 1-16-4-18-10z" opacity="0.85" />
          {/* paws */}
          <ellipse cx="36" cy="83" rx="8" ry="5" opacity="0.9" />
          <ellipse cx="64" cy="83" rx="8" ry="5" opacity="0.9" />
        </g>
      );
  }
}

/** Eye placement differs per body shape so they land on the head. */
const EYE_POS: Record<string, { cx1: number; cx2: number; cy: number; r: number }> = {
  beast: { cx1: 43, cx2: 57, cy: 36, r: 3.6 },
  wyrm: { cx1: 45, cx2: 55, cy: 30, r: 3 },
  avian: { cx1: 44, cx2: 56, cy: 31, r: 3.2 },
  aquatic: { cx1: 32, cx2: 42, cy: 50, r: 3.2 },
  bloom: { cx1: 44, cx2: 56, cy: 60, r: 3.4 },
  spirit: { cx1: 43, cx2: 57, cy: 44, r: 3.6 },
};

export default function CreatureCardArt({ shape, element, isShiny, className }: Props) {
  const meta = ELEMENTS[element] ?? ELEMENTS.SHADOW;
  const [from, to] = meta.colors;
  // Unique per render-target so multiple cards on one page don't share defs.
  const uid = `${element}-${shape}`;
  const eyes = EYE_POS[shape] ?? EYE_POS.beast;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`${meta.nameEn} creature`}
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor={from} stopOpacity="0.55" />
          <stop offset="100%" stopColor={to} stopOpacity="0.08" />
        </radialGradient>
        <linearGradient id={`body-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* elemental aura */}
      <circle cx="50" cy="48" r="46" fill={`url(#bg-${uid})`} />

      <g filter={`url(#glow-${uid})`}>
        <Body shape={shape} fill={`url(#body-${uid})`} />
      </g>
      <Eyes {...eyes} />

      {/* shiny sparkle overlay */}
      {isShiny && (
        <g fill="#fff">
          <path d="M78 20l2.2 6.2L86 28l-5.8 1.8L78 36l-2.2-6.2L70 28l5.8-1.8z" opacity="0.95" />
          <path d="M22 62l1.5 4.2L28 68l-4.5 1.4L22 74l-1.5-4.6L16 68l4.5-1.8z" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}
