function OrnamentGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 4c3 8 3 14 0 20-3-6-3-12 0-20Z"
        fill="currentColor"
      />
      <path
        d="M32 60c-3-8-3-14 0-20 3 6 3 12 0 20Z"
        fill="currentColor"
      />
      <path
        d="M32 24c8 2 13 6 16 12-8 1-14-2-16-12Z"
        fill="currentColor"
      />
      <path
        d="M32 40c-8-2-13-6-16-12 8-1 14 2 16 12Z"
        fill="currentColor"
      />
      <path
        d="M32 24c-8 2-13 6-16 12 8 1 14-2 16-12Z"
        fill="currentColor"
      />
      <path
        d="M32 40c8-2 13-6 16-12-8-1-14 2-16 12Z"
        fill="currentColor"
      />
      <circle cx="32" cy="32" r="5" fill="currentColor" />
      <circle cx="32" cy="32" r="9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function KhmerDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mx-auto flex max-w-xs items-center gap-3 text-gold-500 ${className}`}
      role="separator"
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500 to-gold-500" />
      <OrnamentGlyph className="h-6 w-6 shrink-0" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-500 to-gold-500" />
    </div>
  );
}
