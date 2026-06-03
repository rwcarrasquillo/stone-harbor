import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * The Long Light — ESLint config.
 *
 * Mirrors Stone Harbor's config. Two of React 19's newer hooks rules
 * trip the standard Supabase data-load-on-mount pattern; we downgrade
 * them from error to warn so they stay visible in editor tooltips but
 * don't block `next build`.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
