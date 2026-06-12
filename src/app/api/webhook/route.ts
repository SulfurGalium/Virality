// src/app/api/webhook/route.ts
// Handles Stripe subscription lifecycle events — trial logic removed

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[webhook] ${event.type}`);

  try {
    switch (event.type) {

      // ── Subscription created or updated ─────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id;
        if (!priceId) break;

        const plan = getPlanFromPriceId(priceId);
        const userId = sub.metadata?.userId;
        if (!userId) {
          console.warn("[webhook] No userId in subscription metadata");
          break;
        }

        await db.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            subscriptionStatus: sub.status,
            // subscriptionEndsAt only set if user has explicitly scheduled cancellation
            subscriptionEndsAt: sub.cancel_at
              ? new Date(sub.cancel_at * 1000)
              : null,
          },
        });

        // Reset monthly usage on plan change
        if (plan !== "FREE") {
          await db.user.update({
            where: { id: userId },
            data: { analysesThisMonth: 0, usageResetAt: new Date() },
          });
        }

        console.log(`[webhook] User ${userId} → plan ${plan} (${sub.status})`);
        break;
      }

      // ── Subscription deleted ─────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await db.user.update({
          where: { id: userId },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
            stripePriceId: null,
            subscriptionStatus: "canceled",
            subscriptionEndsAt: null,
            analysesThisMonth: 0,
          },
        });

        console.log(`[webhook] User ${userId} downgraded to FREE`);
        break;
      }

      // ── Payment succeeded — reset usage and mirror invoice ───────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await db.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        if (!user) break;

        // Reset monthly usage on successful renewal
        await db.user.update({
          where: { id: user.id },
          data: { analysesThisMonth: 0, usageResetAt: new Date() },
        });

        // Mirror invoice for billing history display
        if (invoice.id && invoice.amount_paid > 0) {
          await db.invoice.upsert({
            where: { id: invoice.id },
            create: {
              id: invoice.id,
              userId: user.id,
              amountPaid: invoice.amount_paid,
              currency: invoice.currency,
              status: invoice.status ?? "paid",
              pdfUrl: invoice.invoice_pdf ?? null,
              periodStart: new Date((invoice.period_start ?? 0) * 1000),
              periodEnd: new Date((invoice.period_end ?? 0) * 1000),
            },
            update: { status: invoice.status ?? "paid" },
          });
        }

        console.log(`[webhook] Invoice paid: ${invoice.id} — $${invoice.amount_paid / 100}`);
        break;
      }

      // ── Payment failed ───────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await db.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        if (!user) break;

        await db.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "past_due" },
        });

        // TODO: send payment failure email via Resend/Loops
        console.log(`[webhook] Payment failed for user ${user.id}`);
        break;
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[webhook] Handler error for ${event.type}:`, err);
    // Return 200 so Stripe does not retry — error is logged above
    return NextResponse.json({ received: true, error: "Handler failed" });
  }

  return NextResponse.json({ received: true });
}

export const runtime = "nodejs";
