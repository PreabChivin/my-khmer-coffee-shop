import type { CapacitorConfig } from "@capacitor/cli";

// This app is a fully server-rendered Next.js app backed by Prisma/Postgres
// (57 dynamic API routes, cookie/JWT auth, checkout, admin dashboard) — it
// cannot be statically exported into `webDir` the way a plain SPA can.
// Instead the Android/iOS shell loads the real, already-deployed production
// site directly via `server.url`. `webDir` still has to point at *something*
// on disk for `cap add`/`cap sync` to copy in (see www/index.html) — it's a
// brief splash the WebView shows for a moment before `server.url` takes over,
// never the actual app content.
const config: CapacitorConfig = {
  appId: "com.benchimincafe.app",
  appName: "BENCHIMIN CAFE",
  webDir: "www",
  server: {
    url: "https://my-khmer-coffee-shop.vercel.app",
    androidScheme: "https",
    cleartext: false,
  },
};

export default config;
