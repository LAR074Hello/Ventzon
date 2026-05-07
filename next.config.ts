import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Alias the community Apple Sign In package to our local stub.
  // The community package uses ESM-only dist with extensionless imports
  // that Turbopack can't resolve. Our stub calls registerPlugin() directly,
  // which works in both web builds and native iOS at runtime.
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@capacitor-community/apple-sign-in": path.resolve(
        process.cwd(),
        "src/lib/apple-sign-in-plugin.ts"
      ),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@capacitor-community/apple-sign-in":
        "./src/lib/apple-sign-in-plugin.ts",
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: "ventzon",
  project: "ventzon-web",
  // Only upload source maps in CI (Vercel builds), not local dev
  silent: true,
  // Disable source map upload until SENTRY_AUTH_TOKEN is configured
  disableSourceMapUpload: !process.env.SENTRY_AUTH_TOKEN,
  // Tree-shake Sentry debug logging in production
  disableLogger: true,
});
