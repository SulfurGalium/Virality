// src/lib/stripe.ts — SECURITY HARDENED
// Fixes: open redirect in success/cancel URLs, missing priceId validation,
//        idempotent checkout sessions

import Stripe from "stripe";
import { PLANS, PlanKey } from "./plans";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
  // Timeout all Stripe calls at 30s to prevent hanging
  timeout: 30_000,
  maxNetworkRetries: 2,
});

// All known valid price IDs — validated at checkout to prevent price manipulation
function getKnownPriceIds(): Set<string> {
  const ids = new Set<string>();
  for (const plan of Object.values(PLANS)) {
    if ("stripePriceIds" in plan) {
      const p = plan.stripePriceIds as { monthly: string; yearly: string };
      if (p.monthly) ids.add(p.monthly);
      if (p.yearly) ids.add(p.yearly);
    }
  }
  return ids;
}

// Validate that a URL belongs to our own domain (prevent open redirect)
function validateOwnUrl(url: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const parsed = new URL(url);
    const app = new URL(appUrl);
    if (parsed.hostname !== app.hostname) {
      throw new Error(`Redirect URL hostname mismatch: ${parsed.hostname}`);
    }
    return url;
  } catch (err) {
    throw new Error(`Invalid or unsafe redirect URL: ${url}`);
  }
}

// ─── Customer management ─────────────────────────────────────────────────────

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const { db } = await import("./db");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) return user.stripeCustomerId;

  // Check if a customer already exists for this email in Stripe
  // (handles edge case: webhook delay after previous signup)
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0 && existing.data[0].metadata.userId === userId) {
    const customerId = existing.data[0].id;
    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
    return customerId;
  }

  const customer = await stripe.customers.create({
    email,
    name: name?.slice(0, 256) ?? undefined,
    metadata: { userId },
  });

  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Checkout session (idempotent) ────────────────────────────────────────────

export async function createCheckoutSession({
  userId,
  email,
  name,
  priceId,
  plan,
  interval,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  email: string;
  name?: string;
  priceId: string;
  plan: PlanKey;
  interval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  // Validate priceId against known prices (prevents price tampering)
  const knownIds = getKnownPriceIds();
  if (!knownIds.has(priceId)) {
    throw new Error(`Unknown priceId: ${priceId}`);
  }

  // Validate redirect URLs (prevents open redirect)
  const safeSuccessUrl = validateOwnUrl(successUrl);
  const safeCancelUrl = validateOwnUrl(cancelUrl);

  const customerId = await getOrCreateStripeCustomer(userId, email, name);

  // Idempotency key: prevents double-charge from double-click or retry
  const idempotencyKey = `checkout-${userId}-${priceId}-${Date.now().toString().slice(0, -3)}`;

  const session = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      subscription_data: {
        // 7-day trial on both paid plans
        trial_period_days: plan !== "FREE" ? 7 : undefined,
        metadata: { userId, plan, interval },
      },
      metadata: { userId, plan, interval },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: { address: "auto" },
      // Expire session after 30 mins
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      // Require TOS/privacy acceptance
      consent_collection: {
        terms_of_service: "required",
      },
      // Tax collection
      automatic_tax: { enabled: true },
    },
    {
      idempotencyKey,
    }
  );

  return session.url!;
}

// ─── Customer portal ──────────────────────────────────────────────────────────

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const safeReturnUrl = validateOwnUrl(returnUrl);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: safeReturnUrl,
  });

  return session.url;
}

// ─── Price ID → Plan mapping ──────────────────────────────────────────────────

export function getPlanFromPriceId(priceId: string): PlanKey {
  for (const [key, plan] of Object.entries(PLANS)) {
    if ("stripePriceIds" in plan) {
      const ids = plan.stripePriceIds as { monthly: string; yearly: string };
      if (ids.monthly === priceId || ids.yearly === priceId) {
        return key as PlanKey;
      }
    }
  }
  return "FREE";
}
