import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep better-sqlite3 as a server-side external so Next.js/Turbopack never
  // tries to bundle the prebuilt native .node binary — it must be required
  // at runtime from the file system.
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
