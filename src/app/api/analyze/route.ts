// src/app/api/analyze/route.ts — SECURITY HARDENED
// Fixes: IP spoofing, race condition, prompt injection, base64 validation,
//        body size limit, missing content-type check, unsafe auto-user-create

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { analyzeVideo, estimateCostCents, type VideoSignals } from "@/lib/analyzer";
import { checkRateLimit, globalLimiter } from "@/lib/ratelimit";
import { getPlanLimits } from "@/lib/plans";
import {
  getClientIp,
  sanitizeFileName,
  sanitizeForPrompt,
  validateBase64Image,
  sanitizeAiText,
  sanitizeAiArray,
  readBodyWithLimit,
  requireContentType,
} from "@/lib/security";

// ─── Validated request schema ────────────────────────────────────────────────

const FrameSchema = z.object({
  timestamp: z.number().min(0).max(7200),
  // Validated further by validateBase64Image()
  base64: z.string().min(100).max(533_334),
});

const RequestSchema = z.object({
  fileName:   z.string().min(1).max(255),
  fileType:   z.string().min(1).max(50),
  fileSizeMb: z.number().min(0).max(500),

  duration:        z.number().min(0).max(7200).optional(),
  width:           z.number().int().min(1).max(7680).optional(),
  height:          z.number().int().min(1).max(7680).optional(),
  fps:             z.number().min(1).max(240).optional(),
  hasAudio:        z.boolean().optional(),
  audioBpm:        z.number().min(20).max(300).optional(),
  audioType:       z.enum(["music", "speech", "mixed", "silent"]).optional(),
  hasOnScreenText: z.boolean().optional(),
  transcript:      z.string().max(4000).optional(),
  frames:          z.array(FrameSchema).max(5).optional(),

  niche:          z.string().max(50).optional(),
  targetAudience: z.string().max(200).optional(),
});

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let reservedUsageForUserId: string | null = null;

  try {
    // 1. Content-type guard
    if (!requireContentType(req, "application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
    }

    // 2. Body size limit (5MB max — frames are base64 so 5 × ~375KB = ~1.9MB)
    const rawBody = await readBodyWithLimit(req, 5 * 1024 * 1024);
    if (!rawBody) {
      return NextResponse.json({ error: "Request body too large (max 5MB)" }, { status: 413 });
    }

    // 3. Parse and validate body before consuming plan usage
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const raw = parsed.data;

    // 4. Global IP rate limit — spoofing-resistant
    const ip = getClientIp(req);
    const globalCheck = await globalLimiter.limit(ip);
    if (!globalCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(globalCheck.limit),
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(Math.ceil((globalCheck.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // 5. Auth — upsert user if not in DB yet (handles Clerk webhook delays)
    const { userId } = await auth();
    let user = null;
    let planKey: "anon" | "free" | "pro" | "agency" = "anon";

    if (userId) {
      user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        // Webhook hasn't fired yet — create a minimal record so FK constraints are satisfied
        user = await db.user.upsert({
          where:  { id: userId },
          create: { id: userId },
          update: {},
        });
      }
      planKey = user.plan.toLowerCase() as "free" | "pro" | "agency";
    }

    // 6. Plan-level rate limit
    const identifier = userId ?? ip;
    const rateLimitResult = await checkRateLimit(identifier, planKey);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Monthly analysis limit reached.",
          remaining: 0,
          resetAt: rateLimitResult.reset,
          upgradeUrl: "/pricing",
        },
        { status: 429 }
      );
    }

    // 7. Atomic DB usage reservation.
    // The slot is released in catch if AI analysis or persistence fails.
    if (user) {
      const limits = getPlanLimits(user.plan);
      const monthlyLimit = limits.analysesPerMonth;

      if (monthlyLimit !== -1) {
        // Atomic: only increment if under the limit
        const updated = await db.$transaction(async (tx) => {
          const fresh = await tx.user.findUnique({
            where: { id: userId! },
            select: { analysesThisMonth: true },
          });
          if (!fresh || fresh.analysesThisMonth >= monthlyLimit) return null;
          return tx.user.update({
            where: { id: userId! },
            data: {
              analysesThisMonth: { increment: 1 },
              lastAnalysisAt: new Date(),
            },
          });
        });

        if (!updated) {
          return NextResponse.json(
            { error: "Monthly limit reached.", upgradeUrl: "/pricing" },
            { status: 429 }
          );
        }
        reservedUsageForUserId = userId;
      } else {
        // Unlimited plan — reserve the request for observability.
        await db.user.update({
          where: { id: userId! },
          data: {
            analysesThisMonth: { increment: 1 },
            lastAnalysisAt: new Date(),
          },
        });
        reservedUsageForUserId = userId;
      }
    }

    const planLimits = getPlanLimits(user?.plan ?? "FREE");

    // 8. Sanitize all user-supplied strings before they go into AI prompt
    const signals: VideoSignals = {
      ...raw,
      fileSizeMb:     raw.fileSizeMb,
      fileName:       sanitizeFileName(raw.fileName),
      fileType:       raw.fileType.replace(/[^\w/.-]/g, ""),
      niche:          raw.niche          ? sanitizeForPrompt(raw.niche, 50)          : undefined,
      targetAudience: raw.targetAudience ? sanitizeForPrompt(raw.targetAudience, 200): undefined,
      transcript:     raw.transcript     ? sanitizeForPrompt(raw.transcript, 4000)   : undefined,

      // Strip plan-gated features
      frames: planLimits.frameExtraction && raw.frames
        ? raw.frames
            .filter((f) => validateBase64Image(f.base64))
            .map((f) => ({ timestamp: f.timestamp, base64: f.base64 }))
        : undefined,
      hasOnScreenText: planLimits.frameExtraction ? raw.hasOnScreenText : undefined,
    };

    // Reject if no valid frames after validation (don't silently accept bad data)
    if (raw.frames?.length && !signals.frames?.length && planLimits.frameExtraction) {
      return NextResponse.json(
        { error: "Provided frames failed image validation." },
        { status: 400 }
      );
    }

    // 9. Run AI analysis with timeout
    const ANALYSIS_TIMEOUT_MS = 55_000;
    const analysisPromise = analyzeVideo(signals, planLimits.webSearch);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Analysis timeout")), ANALYSIS_TIMEOUT_MS)
    );

    const result = await Promise.race([analysisPromise, timeoutPromise]);

    // 10. Sanitize AI output before persisting (stored XSS prevention)
    const safeResult = {
      score:    Math.max(1, Math.min(100, Math.round(result.score))),
      verdict:  sanitizeAiText(result.verdict, 60),
      desc:     sanitizeAiText(result.desc, 600),
      hook:     sanitizeAiText(result.hook, 800),
      audio:    sanitizeAiText(result.audio, 800),
      tips:     sanitizeAiArray(result.tips, 5, 400),
      caption:  sanitizeAiText(result.caption, 1000),
      hashtags: sanitizeAiArray(result.hashtags, 20, 80).map((h) => h.replace(/[^a-zA-Z0-9_]/g, "")),
      timing:   (result.timing ?? []).slice(0, 6).map((t) => ({
        time:     sanitizeAiText(t.time, 20),
        label:    sanitizeAiText(t.label, 40),
        strength: Math.max(0, Math.min(100, Number(t.strength) || 0)),
      })),
    };

    // 11. Persist analysis and commit usage in one transaction.
    const costCents = estimateCostCents(result.inputTokens, result.outputTokens);
    const analysis = await db.$transaction(async (tx) => {
      const created = await tx.analysis.create({
        data: {
          userId:        userId ?? null,
          videoName:     signals.fileName,
          videoSize:     Math.round(Math.max(0, raw.fileSizeMb * 1024 * 1024)),
          videoDuration: signals.duration,
          videoWidth:    signals.width,
          videoHeight:   signals.height,
          videoFps:      signals.fps,
          hasAudio:      signals.hasAudio ?? false,
          hasCaption:    signals.hasOnScreenText ?? false,
          audioBpm:      signals.audioBpm,
          transcript:    signals.transcript,
          score:         safeResult.score,
          verdict:       safeResult.verdict,
          description:   safeResult.desc,
          hookAnalysis:  safeResult.hook,
          audioAnalysis: safeResult.audio,
          tips:          safeResult.tips,
          caption:       safeResult.caption,
          hashtags:      safeResult.hashtags,
          timing:        safeResult.timing,
          inputTokens:   result.inputTokens,
          outputTokens:  result.outputTokens,
          costUsdCents:  costCents,
        },
        select: { id: true, shareToken: true },
      });

      if (reservedUsageForUserId) {
        await tx.user.update({
          where: { id: reservedUsageForUserId },
          data: { analysesAllTime: { increment: 1 } },
        });
      }

      return created;
    });
    reservedUsageForUserId = null;

    return NextResponse.json({
      ok: true,
      analysisId:  analysis.id,
      shareToken:  analysis.shareToken,
      remaining:   Math.max(0, rateLimitResult.remaining - 1),
      result:      safeResult,
    });

  } catch (err) {
    if (reservedUsageForUserId) {
      try {
        await db.user.update({
          where: { id: reservedUsageForUserId },
          data: { analysesThisMonth: { decrement: 1 } },
        });
      } catch (rollbackErr) {
        console.error("[/api/analyze] Usage rollback failed", rollbackErr);
      }
    }

    // Never leak stack traces or internal error messages
    const isTimeout = err instanceof Error && err.message === "Analysis timeout";
    console.error("[/api/analyze]", isTimeout ? "Timeout" : err);

    return NextResponse.json(
      {
        error: isTimeout
          ? "Analysis took too long. Please try again."
          : "Analysis failed. Please try again.",
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
