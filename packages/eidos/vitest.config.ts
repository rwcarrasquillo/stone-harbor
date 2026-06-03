import { defineConfig } from "vitest/config";

/**
 * Eidos engine — Vitest config.
 *
 * Pure-logic unit tests, colocated with the engine code in src/__tests__.
 * They travel with the package so the engine can be consumed (and verified)
 * independently of any host app. No DOM needed — plain Node environment.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
