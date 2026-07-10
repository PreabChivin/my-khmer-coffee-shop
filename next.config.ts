import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // ⚠️ Catch-all so the admin's free-text image field always renders
      // regardless of host. This makes the Next.js Image Optimizer act as an
      // open proxy for any HTTPS URL — acceptable only because that field is
      // staff-authenticated, not public input. Product images currently
      // render via a plain <img> (see components/ProductImage.tsx), so this
      // only matters if a future component switches to next/image.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
