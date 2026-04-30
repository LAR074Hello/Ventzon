import path from "path";
import type { NextConfig } from "next";

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
  experimental: {
    turbopack: {
      resolveAlias: {
        "@capacitor-community/apple-sign-in":
          "./src/lib/apple-sign-in-plugin.ts",
      },
    },
  },
};

export default nextConfig;
