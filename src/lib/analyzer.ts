// src/lib/analyzer.ts
// Core AI analysis engine — builds prompt from video signals, calls Claude

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface VideoSignals {
  // Basic metadata
  fileName: string;
  fileType: string;
  fileSizeMb: number;

  // Extracted signals (Phase 1+)
  duration?: number;        // seconds
  width?: number;
  height?: number;
  fps?: number;
  hasAudio?: boolean;
  audioBpm?: number;
  audioType?: "music" | "speech" | "mixed" | "silent";
  hasOnScreenText?: boolean;
  transcript?: string;      // Whisper output

  // Extracted frames (base64 JPEG, Phase 1+)
  frames?: Array<{
    timestamp: number;
    base64: string;
  }>;

  // User-provided context
  niche?: string;
  targetAudience?: string;
}

export interface AnalysisResult {
  score: number;
  verdict: string;
  desc: string;
  hook: string;
  audio: string;
  tips: string[];
  caption: string;
  hashtags: string[];
  timing: Array<{ time: string; label: string; strength: number }>;
  inputTokens: number;
  outputTokens: number;
}

function buildSystemPrompt(): string {
  return `You are a senior short-form content and creator marketing analyst for hypr marketing. Base every recommendation on the supplied facts: file metadata, duration, aspect ratio, FPS, audio signals, transcript, user context, and attached frames. If a signal is unknown or missing, say that it is unknown instead of inventing it. Do not claim access to private platform algorithm data or live trends unless a tool result is provided. Give specific, actionable advice tied to observed evidence.

Always respond ONLY with valid JSON. No markdown, no prose, no backticks. Exactly the JSON schema requested.`;
}

function buildUserPrompt(signals: VideoSignals): string {
  const aspectRatio = signals.width && signals.height
    ? `${signals.width}x${signals.height} (${
        signals.width < signals.height ? "vertical ✓" :
        signals.width === signals.height ? "square" : "HORIZONTAL ✗ — bad for Reels"
      })`
    : "unknown";

  const durationNote = signals.duration
    ? `${signals.duration.toFixed(1)}s ${
        signals.duration <= 15 ? "(short-form, high retention potential)" :
        signals.duration <= 60 ? "(mid-length Reel)" :
        signals.duration <= 90 ? "(near Reels limit)" :
        "(TOO LONG for Reels — 90s max)"
      }`
    : "unknown";

  const context = `
VIDEO METADATA:
- Filename: ${signals.fileName}
- Type: ${signals.fileType}
- Size: ${signals.fileSizeMb.toFixed(1)} MB
- Duration: ${durationNote}
- Dimensions: ${aspectRatio}
- FPS: ${signals.fps ?? "unknown"}

AUDIO ANALYSIS:
- Has audio: ${signals.hasAudio ?? "unknown"}
- Audio type: ${signals.audioType ?? "unknown"}
- Estimated BPM: ${signals.audioBpm ? Math.round(signals.audioBpm) : "unknown"}

CONTENT SIGNALS:
- On-screen text/captions detected: ${signals.hasOnScreenText ?? "unknown"}
- Speech transcript: ${signals.transcript ? `"${signals.transcript.slice(0, 600)}${signals.transcript.length > 600 ? "..." : ""}"` : "none"}

USER CONTEXT:
- Content niche: ${signals.niche ?? "not specified"}
- Target audience: ${signals.targetAudience ?? "not specified"}
`;

  return `${context}

${signals.frames?.length ? `ATTACHED VISUAL EVIDENCE: ${signals.frames.length} extracted frame(s), ordered by timestamp. Use only visible details from these frames and avoid naming people, brands, locations, products, or text unless they are clearly visible.` : "ATTACHED VISUAL EVIDENCE: none."}

Analyze this exact short-form video for campaign readiness. Anchor the analysis to the facts above:
- Reference concrete evidence when possible, such as duration, orientation, FPS, audio presence/type, transcript content, on-screen text status, and visible frame details.
- Separate observed facts from recommendations. Do not infer performance, audience intent, trend status, or creator identity from missing data.
- If the first three seconds cannot be verified from frames or transcript, state that limitation and assess the available hook evidence instead.
- If creator collaboration would help, include one practical note in the tips about what to clarify before a future creator meeting.
- If something is clearly wrong for short-form viewing, such as horizontal format, no detected captions for speech, unclear opening payoff, or excessive length, say so directly and explain the likely viewer impact.

Respond with ONLY this JSON:
{
  "score": <integer 1-100>,
  "verdict": "<2-4 word punchy verdict>",
  "desc": "<2-sentence honest assessment tied to observed facts and missing facts>",
  "hook": "<3-sentence hook analysis based on available first-frame/transcript/timing evidence; name uncertainty if the opening is not visible>",
  "audio": "<3-sentence audio/pacing analysis using supplied audio fields and transcript; do not invent sounds>",
  "tips": [
    "<tip 1 — specific, actionable, and supported by the evidence above>",
    "<tip 2>",
    "<tip 3>",
    "<tip 4>",
    "<tip 5>"
  ],
  "caption": "<complete ready-to-post caption with emojis, 80-130 words, hook + story + CTA>",
  "hashtags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12"],
  "timing": [
    {"time": "8–9 AM", "label": "Morning scroll", "strength": 78},
    {"time": "12–2 PM", "label": "Lunch break", "strength": 65},
    {"time": "7–9 PM", "label": "Prime time", "strength": 95},
    {"time": "10–11 PM", "label": "Late night", "strength": 55}
  ]
}`;
}

export async function analyzeVideo(
  signals: VideoSignals,
  useWebSearch: boolean = false
): Promise<AnalysisResult> {
  // Build content blocks — text prompt + optional frame images
  const userContent: Anthropic.MessageParam["content"] = [];

  // Add frame images first (vision context)
  if (signals.frames?.length) {
    for (const frame of signals.frames.slice(0, 5)) { // max 5 frames
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: frame.base64,
        },
      });
    }
  }

  // Add the text prompt
  userContent.push({
    type: "text",
    text: buildUserPrompt(signals),
  });

  const tools: Anthropic.Tool[] = useWebSearch
    ? [
        {
          name: "web_search",
          description: "Search for current Instagram hashtag, sound, and short-form content references when trend claims need current evidence",
          input_schema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
            },
            required: ["query"],
          },
        },
      ]
    : [];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: userContent }],
    ...(tools.length > 0 ? { tools } : {}),
  });

  // Extract text from response (handle tool use blocks too)
  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("");

  // Clean and parse JSON
  const clean = rawText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: Omit<AnalysisResult, "inputTokens" | "outputTokens">;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // Try to extract JSON from the response if surrounded by text
    const match = clean.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("Failed to parse AI response as JSON");
    parsed = JSON.parse(match[0]);
  }

  // Validate required fields
  if (typeof parsed.score !== "number" || !parsed.verdict || !Array.isArray(parsed.tips)) {
    throw new Error("AI response missing required fields");
  }

  return {
    ...parsed,
    score: Math.max(1, Math.min(100, Math.round(parsed.score))),
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// Cost estimation
export function estimateCostCents(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 300;   // cents
  const outputCost = (outputTokens / 1_000_000) * 1500; // cents
  return Math.ceil(inputCost + outputCost);
}
