/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: Cross-Origin-Embedder-Policy: require-corp was removed.
  // It broke Clerk sign-in modals and Stripe checkout iframes because
  // those cross-origin resources do not send CORP headers.
  // If you later add ffmpeg.wasm processing, scope COEP only to the
  // specific route that needs it (e.g. /api/process) via a separate
  // headers() entry, never globally.

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
