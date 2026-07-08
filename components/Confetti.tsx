"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 🎉 Dependency-free confetti burst. Mount it (or remount via a changing
 * `key`) to fire a one-shot celebration across the screen; it removes itself
 * once the animation finishes. Fired when an admin approves an order.
 */
const COLORS = ["#ffc32e", "#ffb7b2", "#b5ead7", "#f4638a", "#9a82ea", "#7fd1ae"];
const EMOJIS = ["💖", "⭐", "🧸", "✨", "🧋"];
const DURATION_MS = 2600;

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);
    const parts = Array.from({ length: 190 }).map(() => {
      // ~28% of particles are floating heart/star/bear emoji.
      const isEmoji = Math.random() < 0.28;
      return {
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.4,
        r: isEmoji ? 16 + Math.random() * 14 : 4 + Math.random() * 7,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: -2.5 + Math.random() * 5,
        vy: 2 + Math.random() * 4.5,
        rot: Math.random() * Math.PI,
        vr: -0.25 + Math.random() * 0.5,
        rect: Math.random() < 0.5,
        emoji: isEmoji ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : null,
      };
    });

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.emoji) {
          ctx.font = `${p.r}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
        } else {
          ctx.fillStyle = p.c;
          if (p.rect) ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
          else {
            ctx.beginPath();
            ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
      if (elapsed < DURATION_MS) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (done) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden="true"
    />
  );
}
