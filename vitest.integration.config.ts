import { defineConfig } from "vitest/config"
import path from "path"

/**
 * Integration tests against real database.
 * Run with: pnpm test:integration
 * Requires: DATABASE_URL in .env (or DATABASE_TEST_URL for a separate test DB)
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.integration.test.ts"],
    setupFiles: ["./server/afs/__tests__/setup.integration.ts"],
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
