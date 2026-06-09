// src/lib/plans.ts
// Single source of truth for plan limits and pricing

export const PLANS = {
  FREE: {
    name: "Free",
    tagline: "Get started",
    price: { monthly: 0, yearly: 0 },
    limits: {
      analysesPerMonth: 4,
      frameExtraction: false,     // filename-only analysis
      transcription: false,       // no Whisper
      webSearch: false,           // no real-time trending
      pdfExport: false,
      historyDays: 7,
      shareReports: false,
      apiAccess: false,
      supportLevel: "community",
    },
    badge: null,
  },

  PRO: {
    name: "Pro",
    tagline: "For serious creators",
    price: {
      monthly: 900,   // cents → $9/mo
      yearly: 7900,   // cents → $79/yr (save $29)
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      yearly:  process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    },
    limits: {
      analysesPerMonth: 100,
      frameExtraction: true,
      transcription: true,
      webSearch: true,
      pdfExport: true,
      historyDays: 365,
      shareReports: true,
      apiAccess: false,
      supportLevel: "email",
    },
    badge: "Most popular",
  },

  AGENCY: {
    name: "Agency",
    tagline: "For teams & brands",
    price: {
      monthly: 4900,  // cents → $49/mo
      yearly: 39900,  // cents → $399/yr (save $189)
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID!,
      yearly:  process.env.STRIPE_AGENCY_YEARLY_PRICE_ID!,
    },
    limits: {
      analysesPerMonth: -1,       // unlimited (-1 = no cap)
      frameExtraction: true,
      transcription: true,
      webSearch: true,
      pdfExport: true,
      historyDays: -1,            // unlimited
      shareReports: true,
      apiAccess: true,
      supportLevel: "priority",
    },
    badge: "Best value",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: PlanKey) {
  return PLANS[plan].limits;
}

export function canAnalyze(plan: PlanKey, usedThisMonth: number): boolean {
  const limit = PLANS[plan].limits.analysesPerMonth;
  if (limit === -1) return true;
  return usedThisMonth < limit;
}

export function formatPrice(cents: number, interval: "monthly" | "yearly"): string {
  if (cents === 0) return "Free";
  const dollars = cents / 100;
  if (interval === "yearly") {
    const monthly = dollars / 12;
    return `$${monthly.toFixed(2)}/mo`;
  }
  return `$${dollars}/mo`;
}

export function yearlySavings(plan: PlanKey): number {
  const p = PLANS[plan].price;
  return Math.max(0, (p.monthly * 12) - p.yearly);
}
