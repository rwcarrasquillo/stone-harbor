const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@stone-harbor/eidos", "@stone-harbor/knowledge"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fbqcmtcvgijlemfpncay.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: "stone-harbor",
  project: "the-long-light",
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
