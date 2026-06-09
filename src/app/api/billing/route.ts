// src/app/api/billing/route.ts
// POST /api/billing — create checkout or portal session
// GET  /api/billing — get current subscription info

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createCheckoutSession,
  createPortalSession,
  getOrCreateStripeCustomer,
} from "@/lib/stripe";
import { PLANS, PlanKey } from "@/lib/plans";

const CheckoutSchema = z.object({
  action: z.literal("checkout"),
  plan: z.enum(["PRO", "AGENCY"]),
  interval: z.enum(["monthly", "yearly"]),
});

const PortalSchema = z.object({
  action: z.literal("portal"),
});

const RequestSchema = z.discriminatedUnion("action", [CheckoutSchema, PortalSchema]);

// ── GET: subscription status ──────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      trialEndsAt: true,
      analysesThisMonth: true,
      analysesAllTime: true,
      usageResetAt: true,
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          amountPaid: true,
          currency: true,
          status: true,
          pdfUrl: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const planConfig = PLANS[user.plan];
  const monthlyLimit = planConfig.limits.analysesPerMonth;

  return NextResponse.json({
    plan: user.plan,
    planName: planConfig.name,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt,
    trialEndsAt: user.trialEndsAt,
    isOnTrial: user.trialEndsAt ? new Date() < user.trialEndsAt : false,
    usage: {
      thisMonth: user.analysesThisMonth,
      allTime: user.analysesAllTime,
      limit: monthlyLimit,
      remaining: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - user.analysesThisMonth),
      resetAt: user.usageResetAt,
    },
    invoices: user.invoices,
  });
}

// ── POST: create checkout or portal session ───────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Checkout
  if (parsed.data.action === "checkout") {
    const { plan, interval } = parsed.data;
    const planConfig = PLANS[plan];

    if (!("stripePriceIds" in planConfig)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = planConfig.stripePriceIds[interval];

    const url = await createCheckoutSession({
      userId,
      email,
      name,
      priceId,
      plan: plan as PlanKey,
      interval,
      successUrl: `${appUrl}/dashboard?upgraded=true&plan=${plan.toLowerCase()}`,
      cancelUrl: `${appUrl}/pricing?canceled=true`,
    });

    return NextResponse.json({ url });
  }

  // Portal
  if (parsed.data.action === "portal") {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 400 });
    }

    const url = await createPortalSession(
      user.stripeCustomerId,
      `${appUrl}/dashboard`
    );

    return NextResponse.json({ url });
  }
}

export const runtime = "nodejs";
