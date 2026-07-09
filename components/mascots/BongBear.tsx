/**
 * 🐻 Bong Bear (ខ្លាឃ្មុំ Bong Bear) — the cafe's cute Khmer guide mascot,
 * a milk-chocolate bear wearing a little palm-leaf hat. Pose variants power the
 * gamified order tracker and the KHQR page.
 */
export type BongBearPose = "wave" | "sleep" | "brew" | "cheer" | "sad";

export default function BongBear({
  pose = "wave",
  size = 140,
  className = "",
}: {
  pose?: BongBearPose;
  size?: number;
  className?: string;
}) {
  const fur = "#b5794a";
  const furDark = "#8a5636";
  const cream = "#fbe3d8";
  const blush = "#ffb7b2";
  const dark = "#3a2210";
  const leaf = "#7fd1ae";
  const leafDark = "#4fb98c";

  return (
    <svg
      viewBox="0 0 160 170"
      role="img"
      aria-label="Bong Bear mascot"
      className={className}
      width={size}
      height={size}
    >
      {/* soft ground shadow */}
      <ellipse cx="80" cy="160" rx="42" ry="7" fill="rgba(74,44,17,0.12)" />

      {/* cheer: glowing golden cup held overhead */}
      {pose === "cheer" && (
        <g className="animate-twinkle">
          <circle cx="80" cy="20" r="20" fill="#ffe9a8" opacity="0.7" />
          <path d="M68 12 h24 l-3 18 a9 9 0 0 1-18 0 Z" fill="#ffc32e" stroke="#eca617" strokeWidth="2" />
          <ellipse cx="80" cy="12" rx="12" ry="3.5" fill="#fff3c4" />
        </g>
      )}

      {/* sad: falling teardrops */}
      {pose === "sad" && (
        <g fill="#7fc4e0">
          <path
            className="animate-sleep-z"
            d="M58 78 q-3 5 0 9 q3 -1 3 -5 q0 -3 -3 -4Z"
          />
          <path
            className="animate-sleep-z"
            style={{ animationDelay: "0.5s" }}
            d="M102 78 q-3 5 0 9 q3 -1 3 -5 q0 -3 -3 -4Z"
          />
        </g>
      )}

      {/* sleep: drifting Zzz */}
      {pose === "sleep" && (
        <g fill="#9a82ea" fontFamily="sans-serif" fontWeight="700">
          <text x="112" y="42" fontSize="16" className="animate-sleep-z">z</text>
          <text x="122" y="30" fontSize="20" className="animate-sleep-z" style={{ animationDelay: "0.6s" }}>Z</text>
        </g>
      )}

      {/* ears */}
      <circle cx="44" cy="44" r="17" fill={fur} />
      <circle cx="116" cy="44" r="17" fill={fur} />
      <circle cx="44" cy="44" r="8" fill={blush} />
      <circle cx="116" cy="44" r="8" fill={blush} />

      {/* palm-leaf hat */}
      <g>
        <path d="M80 8 C64 14 58 26 60 34 C74 32 82 22 80 8 Z" fill={leaf} stroke={leafDark} strokeWidth="1.5" />
        <path d="M80 8 C96 14 102 26 100 34 C86 32 78 22 80 8 Z" fill={leaf} stroke={leafDark} strokeWidth="1.5" />
        <path d="M80 6 C78 20 80 30 80 34 C82 30 84 20 80 6 Z" fill={leafDark} />
        <circle cx="80" cy="10" r="3.5" fill="#ffc32e" />
      </g>

      {/* head */}
      <circle cx="80" cy="70" r="42" fill={fur} />

      {/* muzzle */}
      <ellipse cx="80" cy="84" rx="22" ry="16" fill={cream} />
      <ellipse cx="80" cy="78" rx="5" ry="3.5" fill={dark} />

      {/* eyes */}
      {pose === "sleep" ? (
        <g stroke={dark} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M56 68 q8 7 16 0" />
          <path d="M88 68 q8 7 16 0" />
        </g>
      ) : pose === "sad" ? (
        <g>
          <ellipse cx="64" cy="69" rx="6" ry="7" fill={dark} />
          <ellipse cx="96" cy="69" rx="6" ry="7" fill={dark} />
          <path d="M56 60 q8 -5 15 -1" stroke={dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M89 59 q7 -4 15 1" stroke={dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <ellipse cx="64" cy="66" rx="6.5" ry="8.5" fill={dark} />
          <ellipse cx="96" cy="66" rx="6.5" ry="8.5" fill={dark} />
          <circle cx="66" cy="63" r="2.4" fill="#fff" />
          <circle cx="98" cy="63" r="2.4" fill="#fff" />
        </g>
      )}

      {/* blush */}
      <circle cx="54" cy="82" r="7" fill={blush} opacity="0.85" />
      <circle cx="106" cy="82" r="7" fill={blush} opacity="0.85" />

      {/* mouth */}
      {pose === "cheer" ? (
        <path d="M72 88 q8 10 16 0" fill={dark} />
      ) : pose === "sad" ? (
        <path d="M74 92 q6 -6 12 0" stroke={dark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M74 87 q6 6 12 0" stroke={dark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}

      {/* body */}
      <ellipse cx="80" cy="132" rx="34" ry="27" fill={fur} />
      <ellipse cx="80" cy="136" rx="20" ry="16" fill={cream} />

      {/* feet */}
      <ellipse cx="62" cy="156" rx="11" ry="7" fill={furDark} />
      <ellipse cx="98" cy="156" rx="11" ry="7" fill={furDark} />

      {/* arms per pose */}
      {pose === "wave" && (
        <g className="animate-wiggle" style={{ transformOrigin: "116px 118px" }}>
          <path d="M112 120 q18 -6 20 -26" stroke={fur} strokeWidth="13" fill="none" strokeLinecap="round" />
          <circle cx="132" cy="92" r="8" fill={fur} />
        </g>
      )}
      {pose === "sleep" && (
        <>
          <path d="M50 128 q-14 4 -16 18" stroke={fur} strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M110 128 q14 4 16 18" stroke={fur} strokeWidth="12" fill="none" strokeLinecap="round" />
          {/* empty cup beside */}
          <g transform="translate(120 140)">
            <path d="M0 0 h18 l-2 14 a7 7 0 0 1-14 0 Z" fill="#fff" stroke={furDark} strokeWidth="1.5" />
          </g>
        </>
      )}
      {pose === "brew" && (
        <>
          <path d="M52 126 q-6 8 4 16" stroke={fur} strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M108 126 q6 8 -4 16" stroke={fur} strokeWidth="12" fill="none" strokeLinecap="round" />
          {/* steaming cup */}
          <g>
            <path className="animate-steam" d="M74 108 q-3 -6 0 -12" stroke="#e2ab8d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path className="animate-steam" style={{ animationDelay: "0.5s" }} d="M86 108 q3 -6 0 -12" stroke="#e2ab8d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M66 122 h28 l-3 20 a11 11 0 0 1-22 0 Z" fill="#fff" stroke={furDark} strokeWidth="2" />
            <ellipse cx="80" cy="122" rx="14" ry="3.5" fill="#8a5636" />
          </g>
        </>
      )}
      {pose === "cheer" && (
        <>
          <path d="M52 122 q-10 -12 20 -28" stroke={fur} strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M108 122 q10 -12 -20 -28" stroke={fur} strokeWidth="12" fill="none" strokeLinecap="round" />
        </>
      )}
      {pose === "sad" && (
        <>
          <path d="M50 122 q-8 14 -4 26" stroke={fur} strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M110 122 q8 14 4 26" stroke={fur} strokeWidth="12" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
