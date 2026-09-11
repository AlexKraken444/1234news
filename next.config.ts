import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/*": ["./db/telejka.sql", "./db/features.sql", "./db/community.sql", "./db/push.sql"] },
};

export default nextConfig;
