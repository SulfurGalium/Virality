// src/lib/stripe.ts
// Stripe helpers — no trial logic anywhere in this file.

import Stripe from "stripe";
import { PLANS, PlanKey } from "./plans";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export function getPlanFromPriceId(priceId: string): PlanKey {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (!("stripePriceIds" in plan)) continue;
    const ids = plan.stripePriceIds as Record<string, string>;
    if (Object.values(ids).includes(priceId)) {
      return key as PlanKey;
    }
  }
  return "FREE";
}

interface CheckoutOptions {
  userId: string;
  email: string;
  name: string;
  priceId: string;
  plan: PlanKey;
  interval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(opts: CheckoutOptions): Promise<string> {
  // Validate priceId is one we recognise — prevents checkout with arbitrary IDs
  const validPriceIds = Object.values(PLANS)
    .flatMap((p) => ("stripePriceIds" in p ? Object.values(p.stripePriceIds as Record<string, string>) : []));

  if (!validPriceIds.includes(opts.priceId)) {
    throw new Error("Invalid price ID");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: opts.email,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    // No trial_period_days — trials removed from product
    subscription_data: {
      metadata: { userId: opts.userId },
    },
    consent_collection: {
      terms_of_service: "required",
    },
    metadata: {
      userId: opts.userId,
      plan: opts.plan,
      interval: opts.interval,
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const { db } = await import("./db");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
