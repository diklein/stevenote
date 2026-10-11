import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Private decks are symlinked in from a sibling repo, so the parent folder is the root.
  turbopack: { root: path.join(__dirname, "..") },
  outputFileTracingRoot: path.join(__dirname, ".."),
  // No Next.js badge in the corner of the stage while presenting from the dev server. Errors still surface.
  devIndicators: false,
};

export default nextConfig;
