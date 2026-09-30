import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the container image (deploy/k8s).
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
