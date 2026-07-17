import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // pdfkit uses Node.js built-ins (fs, stream, zlib) that can't be
  // webpack-bundled — tell Next.js to require() them at runtime instead.
  serverExternalPackages: ["pdfkit"],
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

// withSentryConfig runs the Sentry build plugin, which reaches out to Sentry's
// servers at startup. In sandboxed/offline dev that call never returns and hangs
// `next dev` before it can even print its banner. Only wrap for production builds
// (Vercel/CI), where the network is available and source maps actually matter.
const config =
  process.env.NODE_ENV === "production"
    ? withSentryConfig(nextConfig, {
        org: "ventzon",
        project: "ventzon-web",
        // Only upload source maps in CI (Vercel builds), not local dev
        silent: true,
        // Disable source map upload until SENTRY_AUTH_TOKEN is configured
        sourcemaps: {
          disable: !process.env.SENTRY_AUTH_TOKEN,
        },
      })
    : nextConfig;

export default config;
