"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

/**
 * 🔍 Small clickable thumbnail of the shop's static KHQR payment code —
 * lets staff quickly zoom in on the exact QR code the customer was shown
 * during checkout, without leaving the order card. Opens a full-size
 * lightbox on click/tap.
 */
export default function QrZoomThumbnail() {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsZoomed(true)}
        aria-label="Zoom shop QR code"
        className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gold-500/60 bg-white shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/my-khqr.png"
          alt="Shop KHQR payment code"
          className="h-full w-full object-contain p-0.5"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-coffee-900/0 text-transparent transition-colors group-hover:bg-coffee-900/40 group-hover:text-white">
          <ZoomIn size={16} />
        </span>
      </button>

      {isZoomed && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-coffee-900/80 p-4 backdrop-blur-sm"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              aria-label="Close"
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-coffee-900 text-white shadow-lg"
            >
              <X size={16} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/my-khqr.png"
              alt="Shop KHQR payment code"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
