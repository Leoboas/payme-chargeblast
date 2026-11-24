import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Next 16's webpack resolver selects the CJS fallback for this ESM chain.
      // Pinning the package entrypoints keeps Radix Popover on the matching exports.
      "@floating-ui/core$": path.resolve("node_modules/@floating-ui/core/dist/floating-ui.core.mjs"),
      "@floating-ui/dom$": path.resolve("node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs"),
      "@floating-ui/react-dom$": path.resolve("node_modules/@floating-ui/react-dom/dist/floating-ui.react-dom.mjs"),
    };
    return config;
  },
  async headers() { return [{ source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }, { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }] }]; },
};
export default nextConfig;
