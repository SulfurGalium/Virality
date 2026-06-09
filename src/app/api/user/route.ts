// src/app/api/user/route.ts
// GET /api/user — returns current user's plan, usage, and analysis history

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/plans";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  let user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      imageUrl: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      trialEndsAt: true,
      analysesThisMonth: true,
      analysesAllTime: true,
      usageResetAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 });
    }

    user = await db.user.create({
      data: {
        id: userId,
        email,
        name: clerkUser?.fullName ?? clerkUser?.username ?? null,
        imageUrl: clerkUser?.imageUrl ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        analysesThisMonth: true,
        analysesAllTime: true,
        usageResetAt: true,
        createdAt: true,
      },
    });
  }

  const [analyses, totalAnalyses] = await Promise.all([
    db.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        videoName: true,
        videoSize: true,
        videoDuration: true,
        videoWidth: true,
        videoHeight: true,
        score: true,
        verdict: true,
        description: true,
        shareToken: true,
        isPublic: true,
        createdAt: true,
      },
    }),
    db.analysis.count({ where: { userId } }),
  ]);

  const planConfig = PLANS[user.plan];
  const monthlyLimit = planConfig.limits.analysesPerMonth;

  return NextResponse.json({
    user: {
      ...user,
      plan: user.plan,
      planName: planConfig.name,
      limits: planConfig.limits,
      usage: {
        thisMonth: user.analysesThisMonth,
        allTime: user.analysesAllTime,
        limit: monthlyLimit,
        remaining:
          monthlyLimit === -1
            ? -1
            : Math.max(0, monthlyLimit - user.analysesThisMonth),
        resetAt: user.usageResetAt,
      },
    },
    analyses,
    pagination: {
      page,
      limit,
      total: totalAnalyses,
      pages: Math.ceil(totalAnalyses / limit),
    },
  });
}

export const runtime = "nodejs";
