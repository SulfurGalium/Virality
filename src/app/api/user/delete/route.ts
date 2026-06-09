// src/app/api/user/delete/route.ts
// POST /api/user/delete
// GDPR Article 17 "Right to Erasure" + CCPA deletion right
// Hard-deletes user PII while anonymizing records required for legal retention

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Require explicit confirmation in body
  let body: { confirm?: boolean } = {};
  try {
    body = await req.json();
  } catch { /* empty body */ }

  if (body.confirm !== true) {
    return NextResponse.json(
      { error: "Send { confirm: true } to confirm account deletion." },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true, plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 1. Cancel active Stripe subscription
  if (user.stripeSubscriptionId && user.plan !== "FREE") {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err) {
      console.error("[delete-user] Failed to cancel subscription:", err);
      // Continue with deletion even if Stripe cancel fails
    }
  }

  // 2. Anonymize user record (don't hard delete — preserve for:
  //    - invoice records (7-year tax retention)
  //    - aggregate usage statistics (fully anonymized)
  //    - Stripe customer record links for our accounting)
  await db.user.update({
    where: { id: userId },
    data: {
      email:                `deleted_${userId}@deleted.invalid`,
      name:                 null,
      imageUrl:             null,
      stripeCustomerId:     null,   // unlink Stripe (keep invoice records)
      stripeSubscriptionId: null,
      stripePriceId:        null,
      subscriptionStatus:   "canceled",
      plan:                 "FREE",
    },
  });

  // 3. Delete analysis content (personal creative data)
  //    Keep the row but null out all content for aggregate count purposes
  await db.analysis.updateMany({
    where: { userId },
    data: {
      transcript:    null,
      caption:       "",
      hookAnalysis:  "[deleted]",
      audioAnalysis: "[deleted]",
      description:   "[deleted]",
      tips:          [],
      hashtags:      [],
    },
  });

  // 4. Null out share tokens so old links 404
  await db.analysis.updateMany({
    where: { userId },
    data: { shareToken: null, isPublic: false },
  });

  // NOTE: Invoice records are retained per financial regulations (7 years).
  // They contain only billing amounts and dates, not content.

  // 5. Delete Stripe customer (removes card data)
  // Do this last — if it fails, PII is already cleared from our DB
  if (user.stripeCustomerId) {
    try {
      await stripe.customers.del(user.stripeCustomerId);
    } catch (err) {
      console.error("[delete-user] Failed to delete Stripe customer:", err);
    }
  }

  console.log(`[delete-user] User ${userId} data erased per deletion request`);

  return NextResponse.json({
    ok: true,
    message:
      "Your account data has been erased. Invoice records are retained for 7 years " +
      "as required by financial regulations, but contain no personal content.",
  });
}

export const runtime = "nodejs";
