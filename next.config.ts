import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep file tracing rooted in this app instead of an unrelated package-lock.json
  // in the user's Windows home directory.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
