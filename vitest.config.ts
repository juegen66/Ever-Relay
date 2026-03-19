import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.test.ts", "fronted/**/*.test.{ts,tsx}"],
    exclude: [
      "**/*.integration.test.ts",
      "**/node_modules/**",
      "**/.next/**",
    ],
    setupFiles: ["./server/afs/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["server/afs/**"],
    },
  },
  resolve: {
    alias: [
      { find: "@/app", replacement: path.resolve(__dirname, "fronted/app") },
      { find: "@/components", replacement: path.resolve(__dirname, "fronted/components") },
      { find: "@/features", replacement: path.resolve(__dirname, "fronted/features") },
      { find: "@/hooks", replacement: path.resolve(__dirname, "fronted/hooks") },
      { find: "@/lib", replacement: path.resolve(__dirname, "fronted/lib") },
      { find: "@/server", replacement: path.resolve(__dirname, "server") },
      { find: "@/shared", replacement: path.resolve(__dirname, "shared") },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
})
