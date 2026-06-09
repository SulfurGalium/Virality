// src/lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Anonymous users: 3 analyses per day (by IP)
export const anonLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 d"),
  prefix: "virality:anon",
  analytics: true,
});

// Free plan users: 4 per month (enforced in DB, Redis as fast-path cache)
export const freeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "30 d"),
  prefix: "virality:free",
  analytics: true,
});

// Pro plan: 100 per month
export const proLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "30 d"),
  prefix: "virality:pro",
  analytics: true,
});

// Global API abuse protection: 20 requests per minute per IP regardless of plan
export const globalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "virality:global",
  analytics: true,
});

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number; // unix timestamp
  limit: number;
};

export async function checkRateLimit(
  identifier: string,
  plan: "anon" | "free" | "pro" | "agency"
): Promise<RateLimitResult> {
  const limiterMap = {
    anon: anonLimiter,
    free: freeLimiter,
    pro: proLimiter,
    agency: null, // unlimited
  };

  if (plan === "agency") {
    return { success: true, remaining: 9999, reset: 0, limit: -1 };
  }

  const limiter = limiterMap[plan];
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit,
  };
}
