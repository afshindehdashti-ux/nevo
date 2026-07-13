// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Preserve the original Lovable-hosted photography when running the project locally.
// A deployment can override this with its own LOVABLE_PREVIEW_HOST value.
process.env.LOVABLE_PREVIEW_HOST ??= "project--d4274815-117e-4165-b985-4a102b99aa9c.lovable.app";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // This backend uses Node-only libraries for email delivery and IMAP inbox processing.
  nitro: { preset: "node-server" },
  vite: {
    // React Email still references the legacy entities path; map it to the supported export.
    resolve: {
      alias: {
        "entities/lib/decode.js": "entities/decode",
      },
    },
    plugins: [mcpPlugin()],
  },
});
