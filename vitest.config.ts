// Minimal Vitest config — just gives us the `@/` path alias from
// tsconfig.json. Deliberately does NOT reuse the app's vite.config.ts
// (which mounts TanStack Start routing, Cloudflare worker adapter, and
// Lovable dev plugins) because those are irrelevant to pure-function
// tests and slow test runs down.

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Keep the tree shallow so CI stays fast; introduce globs here only
    // when we have reason to.
  },
});
