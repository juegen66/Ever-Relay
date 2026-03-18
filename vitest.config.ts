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
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
