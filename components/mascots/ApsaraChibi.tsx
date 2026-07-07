/**
 * 👶✨ Baby Apsara Chibi (ទេពអប្សរបែបតុក្កតា) — an adorable chibi celestial
 * dancer with a golden mkot crown who dances and shoots little hearts when an
 * item is added to the cart.
 */
export default function ApsaraChibi({
  size = 96,
  className = "",
  hearts = false,
}: {
  size?: number;
  className?: string;
  hearts?: boolean;
}) {
  const skin = "#f6c9ba";
  const skinShade = "#e8a98f";
  const gold = "#ffc32e";
  const goldDark = "#eca617";
  const dark = "#3a2210";
  const blush = "#ff8a80";
  const dress = "#f4638a";

  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label="Baby Apsara mascot"
      className={className}
      width={size}
      height={size}
    >
      {/* shooting hearts */}
      {hearts && (
        <g fill={dress}>
          <path className="animate-twinkle" d="M22 40 l4 4 4-4a3 3 0 0 0-4-3 3 3 0 0 0-4 3Z" />
          <path className="animate-twinkle" style={{ animationDelay: "0.4s" }} d="M92 34 l5 5 5-5a3.5 3.5 0 0 0-5-3.5 3.5 3.5 0 0 0-5 3.5Z" />
          <path className="animate-twinkle" style={{ animationDelay: "0.8s" }} d="M96 66 l3.5 3.5 3.5-3.5a2.6 2.6 0 0 0-3.5-2.4 2.6 2.6 0 0 0-3.5 2.4Z" />
        </g>
      )}

      {/* golden mkot crown */}
      <path d="M42 30 L48 12 L54 26 L60 8 L66 26 L72 12 L78 30 Z" fill={gold} stroke={goldDark} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="60" cy="9" r="3" fill={dress} />
      <rect x="42" y="28" width="36" height="6" rx="3" fill={goldDark} />

      {/* hair */}
      <path d="M40 44 C40 26 80 26 80 44 L80 52 C80 40 40 40 40 52 Z" fill={dark} />

      {/* face */}
      <circle cx="60" cy="52" r="21" fill={skin} />

      {/* eyes (big, sparkly) */}
      <ellipse cx="52" cy="52" rx="4.5" ry="6" fill={dark} />
      <ellipse cx="68" cy="52" rx="4.5" ry="6" fill={dark} />
      <circle cx="53.5" cy="49.5" r="1.7" fill="#fff" />
      <circle cx="69.5" cy="49.5" r="1.7" fill="#fff" />

      {/* blush + smile */}
      <circle cx="47" cy="60" r="4.5" fill={blush} opacity="0.8" />
      <circle cx="73" cy="60" r="4.5" fill={blush} opacity="0.8" />
      <path d="M55 61 q5 5 10 0" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* earrings */}
      <circle cx="39" cy="56" r="2.6" fill={gold} />
      <circle cx="81" cy="56" r="2.6" fill={gold} />

      {/* body / sampot dress */}
      <path d="M46 74 Q60 70 74 74 L82 104 Q60 112 38 104 Z" fill={dress} />
      <path d="M46 74 Q60 70 74 74 L76 84 Q60 88 44 84 Z" fill={gold} opacity="0.85" />
      <rect x="52" y="90" width="16" height="4" rx="2" fill={gold} />

      {/* dancing arms (classic apsara mudra) */}
      <path d="M48 78 Q30 74 26 60" stroke={skin} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M72 78 Q90 74 94 60" stroke={skin} strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* bent fingers */}
      <circle cx="26" cy="59" r="4" fill={skinShade} />
      <circle cx="94" cy="59" r="4" fill={skinShade} />

      {/* dancing feet */}
      <ellipse cx="52" cy="108" rx="6" ry="3.5" fill={skinShade} />
      <ellipse cx="68" cy="108" rx="6" ry="3.5" fill={skinShade} />
    </svg>
  );
}
