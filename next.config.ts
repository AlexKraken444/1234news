import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/*": ["./db/telejka.sql", "./db/features.sql", "./db/community.sql", "./db/push.sql", "./db/calls.sql", "./db/social-studio.sql", "./db/polls-inline.sql", "./db/presence.sql", "./db/edit-share.sql", "./db/economy.sql", "./db/subscriptions.sql", "./db/channels.sql", "./db/channel-refresh.sql"] },
};

export default nextConfig;
