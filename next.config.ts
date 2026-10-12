import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the corner "N" badge out of screen recordings; compile errors still show.
  devIndicators: false,
};

export default nextConfig;
