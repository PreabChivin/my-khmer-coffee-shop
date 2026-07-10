"use client";

import { useState } from "react";

/**
 * 🖼️ Drop-in replacement for a plain product `<img>` that never leaves a
 * broken-image icon on the page. Staff can type any image path/URL into the
 * admin CMS — if it 404s, is mistyped, or the host blocks hotlinking, this
 * swaps to a cute bouncing coffee cup placeholder instead of a broken layout.
 */
export default function ProductImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [hasFailed, setHasFailed] = useState(false);

  if (!src || hasFailed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 bg-clay-50 text-clay-400 dark:bg-coffee-900 dark:text-clay-500 ${className ?? ""}`}
      >
        <span className="animate-bounce-cute text-3xl">☕</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setHasFailed(true)} />
  );
}
