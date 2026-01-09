import path from "path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

loadEnv({ path: path.resolve(__dirname, "..", "..", ".env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/api", "@repo/shared"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
