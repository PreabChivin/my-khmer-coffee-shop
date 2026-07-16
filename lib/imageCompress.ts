/**
 * 🖼️ Client-side image compression for chat uploads. Resizes a picked file
 * down to a sane max dimension and re-encodes it as a JPEG data URL, so what
 * we store in ChatMessage.imageUrl (Postgres, base64) is ~100-250KB instead of
 * a multi-megabyte original. Runs entirely in the browser (canvas) — no upload
 * infrastructure — and works identically in the Capacitor Android WebView.
 *
 * EXIF orientation is respected via createImageBitmap({ imageOrientation:
 * "from-image" }) where available, so phone photos don't come out sideways;
 * an <img> fallback covers the rare browser without it.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // reject originals over 5MB

export interface CompressOptions {
  /** Longest-edge cap in px (image is scaled down to fit, never up). */
  maxDim?: number;
  /** JPEG quality 0-1. */
  quality?: number;
}

async function loadBitmap(file: File): Promise<{
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // fall through to the <img> path
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode-failed"));
      el.src = url;
    });
    return {
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Compresses `file` to a JPEG data URL. Throws "not-an-image", "too-large", or
 * "decode-failed" (all handled by the caller for a friendly message).
 */
export async function compressImageToDataUrl(
  file: File,
  { maxDim = 1000, quality = 0.6 }: CompressOptions = {}
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-an-image");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("too-large");

  const src = await loadBitmap(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(src.width, src.height));
    const w = Math.max(1, Math.round(src.width * scale));
    const h = Math.max(1, Math.round(src.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("decode-failed");
    // White matte so transparent PNGs don't flatten to black under JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    src.draw(ctx, w, h);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    src.cleanup();
  }
}
