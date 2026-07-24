import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Stale agent worktrees are full repo copies living inside the repo —
    // linting them double-reports every finding against old snapshots.
    ".claude/**",
    // Native shells and build output, not project source.
    "ios/**",
    "android/**",
    "*.xcarchive/**",
    "VentzonExport*/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
