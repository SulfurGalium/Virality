// src/app/api/user/export/route.ts
// GET /api/user/export
// GDPR Article 20 "Right to Data Portability"
// Returns all personal data in machine-readable JSON format

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, analyses, invoices] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        analysesThisMonth: true,
        analysesAllTime: true,
        lastAnalysisAt: true,
      },
    }),
    db.analysis.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        videoName: true,
        videoDuration: true,
        videoWidth: true,
        videoHeight: true,
        score: true,
        verdict: true,
        description: true,
        hookAnalysis: true,
        audioAnalysis: true,
        tips: true,
        caption: true,
        hashtags: true,
        timing: true,
        transcript: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.findMany({
      where: { userId },
      select: {
        id: true,
        amountPaid: true,
        currency: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportVersion: "1.0",
    notice: "This file contains all personal data hypr marketing holds about your account.",
    account: user,
    analyses,
    billing: {
      invoices,
      note: "Full payment card details are held by Stripe and are not included here.",
    },
  };

  // Return as downloadable JSON file
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="hypr-marketing-data-export-${userId.slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

export const runtime = "nodejs";
