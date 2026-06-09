// src/app/api/transcribe/route.ts — SECURITY HARDENED

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg", "audio/mp4", "audio/mp3", "audio/wav",
  "audio/ogg", "audio/webm", "audio/m4a", "video/mp4",
  "video/webm", "video/quicktime",
]);

const MAX_AUDIO_BYTES = 24 * 1024 * 1024; // 24MB (Whisper limit is 25MB)

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required for transcription." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const limits = getPlanLimits(user.plan);
  if (!limits.transcription) {
    return NextResponse.json(
      { error: "Transcription requires Pro or Agency plan.", upgradeUrl: "/pricing" },
      { status: 403 }
    );
  }

  // Parse multipart
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof Blob)) {
    return NextResponse.json({ error: "Missing 'audio' field" }, { status: 400 });
  }

  // Validate MIME type (don't trust browser — re-read from blob)
  const mimeType = audioFile.type.toLowerCase().split(";")[0].trim();
  if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported audio type: ${mimeType}` },
      { status: 415 }
    );
  }

  // Size check
  if (audioFile.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Audio file too large (max 24MB)" },
      { status: 413 }
    );
  }

  // Read first bytes to verify magic header (prevent MIME spoofing)
  const header = new Uint8Array(await audioFile.slice(0, 12).arrayBuffer());
  if (!isValidAudioHeader(header)) {
    return NextResponse.json({ error: "File does not appear to be valid audio" }, { status: 400 });
  }

  // Forward to Whisper with timeout
  const whisperForm = new FormData();
  whisperForm.append("file", audioFile, "audio.mp4");
  whisperForm.append("model", "whisper-1");
  whisperForm.append("response_format", "text");

  let whisperRes: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperForm,
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Transcription timed out" : "Transcription service unavailable" },
      { status: 502 }
    );
  }

  if (!whisperRes.ok) {
    // Don't forward Whisper's error message — could contain sensitive info
    console.error("[transcribe] Whisper error:", whisperRes.status);
    return NextResponse.json(
      { error: "Transcription failed. Analysis will continue without transcript." },
      { status: 502 }
    );
  }

  const transcript = (await whisperRes.text()).trim();

  // Validate output
  if (!transcript || transcript.length > 10_000) {
    return NextResponse.json({ error: "Invalid transcription response" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, transcript });
}

// Check magic bytes for common audio/video formats
function isValidAudioHeader(bytes: Uint8Array): boolean {
  // MP3: ID3 tag or FF FB/FA/F3
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) return true;
  // MP4/M4A: ftyp box
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return true;
  // WAV: RIFF header
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
  // OGG: OggS
  if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return true;
  // WebM: EBML
  if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) return true;
  return false;
}

export const runtime = "nodejs";
export const maxDuration = 30;
