/**
 * A cute pastel divider — a little heart flanked by sparkles. (Kept the export
 * name for compatibility with existing imports across the app.)
 */
function CuteGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      {/* heart */}
      <path
        d="M32 50S12 38 12 25c0-6 5-10 10-10 4 0 8 3 10 7 2-4 6-7 10-7 5 0 10 4 10 10 0 13-20 25-20 25Z"
        fill="currentColor"
      />
      {/* sparkles */}
      <path d="M50 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="currentColor" opacity="0.8" />
      <path d="M12 46l1.4 3.4L17 51l-3.6 1.6L12 56l-1.4-3.4L7 51l3.6-1.6L12 46Z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export default function KhmerDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mx-auto flex max-w-xs items-center gap-3 text-clay-400 ${className}`}
      role="separator"
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-clay-400 to-clay-400" />
      <CuteGlyph className="h-6 w-6 shrink-0" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-clay-400 to-clay-400" />
    </div>
  );
}
