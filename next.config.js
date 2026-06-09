/** @type {import('next').NextConfig} */
const nextConfig = {
  // Needed for ffmpeg.wasm cross-origin isolation
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },

  // Allow Stripe and Clerk image domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },

  // Ignore Prisma build warnings in edge runtime
  serverExternalPackages: ["@prisma/client", "prisma"],
};

module.exports = nextConfig;
