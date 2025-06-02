import type { NextConfig } from "next";

const nextConfig = {
  // disable just the build-activity indicator:
  devIndicators: {
    buildActivity: false,
  },
  // —or— disable *all* of Next.js’s on-screen dev indicators:
  // devIndicators: false,
};

module.exports = nextConfig;