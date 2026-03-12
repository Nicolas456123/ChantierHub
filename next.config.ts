import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/ChantierHub",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
