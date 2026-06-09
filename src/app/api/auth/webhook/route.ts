// src/app/api/auth/webhook/route.ts
// Clerk webhook — keeps our DB in sync with Clerk user events

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";

interface ClerkUserEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    deleted?: boolean;
  };
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Verify Svix signature
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;
  console.log(`[clerk-webhook] ${type} — ${data.id}`);

  try {
    switch (type) {
      case "user.created":
      case "user.updated": {
        const primaryEmail = data.email_addresses.find(
          (e) => e.id === data.primary_email_address_id
        );

        if (!primaryEmail) break;

        await db.user.upsert({
          where: { id: data.id },
          create: {
            id: data.id,
            email: primaryEmail.email_address,
            name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
            imageUrl: data.image_url,
          },
          update: {
            email: primaryEmail.email_address,
            name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
            imageUrl: data.image_url,
          },
        });

        console.log(`[clerk-webhook] Upserted user ${data.id}`);
        break;
      }

      case "user.deleted": {
        // Soft delete — anonymize PII but keep analysis records for aggregate stats
        await db.user.update({
          where: { id: data.id },
          data: {
            email: `deleted_${data.id}@deleted.local`,
            name: null,
            imageUrl: null,
            stripeCustomerId: null,
            // Keep plan/usage data for analytics, clear PII only
          },
        }).catch(() => {
          // User may not exist if they never analyzed anything
          console.log(`[clerk-webhook] User ${data.id} not found in DB, skipping delete`);
        });
        break;
      }
    }
  } catch (err) {
    console.error(`[clerk-webhook] Handler error:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export const runtime = "nodejs";
