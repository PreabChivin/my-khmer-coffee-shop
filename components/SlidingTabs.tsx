"use client";

/**
 * 🎚️ A segmented control with a sliding pill background that glides between
 * options instead of each button independently swapping its own color —
 * dependency-free (pure CSS transform, no Framer Motion) since this is the
 * only place in the app that needs it. The sliding div is sized to exactly
 * `1/N` of the track and shifted by `activeIndex * 100%` — a percentage
 * transform is relative to the element's OWN box, so this stays correct at
 * any width/option-count without hardcoded math.
 */
export default function SlidingTabs<T extends string>({
  options,
  active,
  onChange,
  className = "",
}: {
  options: { value: T; label: React.ReactNode }[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === active)
  );

  return (
    <div
      className={`relative flex rounded-full bg-coffee-100 p-1 dark:bg-coffee-900 ${className}`}
    >
      <div
        aria-hidden
        className="absolute bottom-1 left-1 top-1 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 shadow transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((option) => {
        const isActive = option.value === active;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={`relative z-10 flex-1 rounded-full py-1.5 text-sm font-bold transition-colors duration-300 ${
              isActive ? "text-white" : "text-coffee-500 dark:text-cream-300"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
