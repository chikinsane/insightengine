import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep all @duckdb packages as server-side externals so Next.js/Turbopack
  // never tries to bundle the native .node binaries — they must be required
  // at runtime from the file system, not inlined into the JS bundle.
  serverExternalPackages: [
    '@duckdb/node-api',
    '@duckdb/node-bindings',
    '@duckdb/node-bindings-linux-x64',
    '@duckdb/node-bindings-linux-arm64',
    '@duckdb/node-bindings-darwin-arm64',
    '@duckdb/node-bindings-darwin-x64',
    '@duckdb/node-bindings-win32-x64',
    '@duckdb/node-bindings-win32-arm64',
  ],
};

export default nextConfig;
