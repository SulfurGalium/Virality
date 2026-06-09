// src/middleware.ts — SECURITY HARDENED
// Full CSP, HSTS, CORS, auth protection

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/user(.*)",
  "/api/billing(.*)",
]);

const isApiRoute = createRouteMatcher(["/api/(.*)"]);

// Routes that bypass CORS check (webhook endpoints — verified by signature)
const isWebhookRoute = createRouteMatcher([
  "/api/webhook(.*)",
  "/api/auth/webhook(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const res = NextResponse.next();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isDev = process.env.NODE_ENV !== "production";

  // ── Security headers (all responses) ────────────────────────────────────

  // Prevent MIME sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  res.headers.set("X-Frame-Options", "DENY");

  // Force HTTPS for 1 year, including subdomains
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Control referrer info
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );

  // Remove server fingerprinting
  res.headers.delete("X-Powered-By");
  res.headers.delete("Server");

  // ── Content Security Policy ──────────────────────────────────────────────
  // Tight policy — explicitly allowlists every external resource
  const scriptSrc = [
    "'self'",
    "https://clerk.virality.app",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.dev",
    "https://challenges.cloudflare.com",
    "https://js.stripe.com",
    ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
  ].join(" ");

  const connectSrc = [
    "'self'",
    "https://clerk.virality.app",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.dev",
    "https://api.clerk.dev",
    "https://challenges.cloudflare.com",
    ...(isDev ? ["http://localhost:*", "ws://localhost:*"] : []),
  ].join(" ");

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Styles: self + Google Fonts + Clerk
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'", // unsafe-inline needed for Clerk/Tailwind
    // Images: self + Clerk avatars + data URIs (for canvas frames)
    "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev",
    // Fonts: Google Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Connect: self (API calls) + Clerk + Upstash (SDK calls from browser if any) + Anthropic (from server only)
    `connect-src ${connectSrc}`,
    // Frames: Stripe checkout (in iframe)
    "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
    // Workers: for ffmpeg.wasm
    "worker-src 'self' blob:",
    // Prevents XSS via data: URIs
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests", "block-all-mixed-content"]),
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);

  // ── CORS (API routes only) ───────────────────────────────────────────────

  if (isApiRoute(req)) {
    // Webhook routes: verified by signature, no CORS needed
    if (!isWebhookRoute(req)) {
      const origin = req.headers.get("origin");
      if (origin) {
        // Strict origin match — no wildcard, no prefix match tricks
        let allowed = false;
        try {
          const originUrl = new URL(origin);
          const appHostname = new URL(appUrl).hostname;
          allowed = originUrl.hostname === appHostname;
        } catch { /* invalid origin — reject */ }

        if (allowed) {
          res.headers.set("Access-Control-Allow-Origin", origin);
          res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.headers.set("Access-Control-Max-Age", "86400");
          res.headers.set("Vary", "Origin");
        } else {
          // Origin mismatch — reject preflight
          if (req.method === "OPTIONS") {
            return new NextResponse(null, { status: 403 });
          }
        }
      }
    }

    // Handle OPTIONS preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }
  }

  return res;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
