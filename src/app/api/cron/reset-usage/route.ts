// src/app/api/cron/reset-usage/route.ts
// Called by Vercel Cron on 1st of each month at 00:00 UTC
// Resets monthly analysis counters for all users

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timingSafeEqual } from "@/lib/security";

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret (timing-safe comparison)
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (!process.env.CRON_SECRET || !timingSafeEqual(authHeader, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await db.user.updateMany({
    data: {
      analysesThisMonth: 0,
      usageResetAt: new Date(),
    },
  });

  console.log(`[cron/reset-usage] Reset ${count} users at ${new Date().toISOString()}`);

  return NextResponse.json({ ok: true, usersReset: count });
}

export const runtime = "nodejs";
