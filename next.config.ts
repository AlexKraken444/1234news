import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/*": ["./db/telejka.sql"] },
};

export default nextConfig;
