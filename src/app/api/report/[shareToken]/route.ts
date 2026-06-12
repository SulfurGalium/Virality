// src/app/api/report/[shareToken]/route.ts
// GET /api/report/:shareToken
// Returns a single analysis. User must own it (or it must be isPublic).
// Next.js 15+: params is a Promise — must be awaited.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  if (!shareToken || typeof shareToken !== "string") {
    return NextResponse.json({ error: "Invalid share token" }, { status: 400 });
  }

  const { userId } = await auth();

  const analysis = await db.analysis.findUnique({
    where: { shareToken },
    select: {
      id: true,
      userId: true,
      isPublic: true,
      videoName: true,
      score: true,
      verdict: true,
      description: true,
      hookAnalysis: true,
      audioAnalysis: true,
      tips: true,
      caption: true,
      hashtags: true,
      timing: true,
      createdAt: true,
    },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const isOwner = userId && analysis.userId === userId;
  if (!isOwner && !analysis.isPublic) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(analysis, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export const runtime = "nodejs";
