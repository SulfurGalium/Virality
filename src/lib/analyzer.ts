// src/lib/analyzer.ts
// Core AI analysis engine — builds prompt from video signals, calls Claude

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface VideoSignals {
  fileName: string;
  fileType: string;
  fileSizeMb: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio?: boolean;
  audioBpm?: number;
  audioType?: "music" | "speech" | "mixed" | "silent";
  hasOnScreenText?: boolean;
  transcript?: string;
  frames?: Array<{ timestamp: number; base64: string }>;
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
  return `You are a senior short-form content strategist for Hypr Marketing. Your job is to give brands and creator teams a frank, evidence-based verdict on whether a video is ready for paid or organic campaign distribution.

Rules:
- Ground every claim in the supplied signals: metadata, audio type, BPM, transcript, frame contents, niche, audience.
- Never invent data that was not supplied. If a signal is missing, say it is unknown and note the implication.
- Be direct. If something is wrong, name it and explain the viewer impact. Do not soften findings with filler phrases like "consider exploring" or "it may be worth."
- Captions advice must be informed by audio type: music-only content needs text overlays for messaging; speech content needs captions for sound-off viewers; mixed content needs both; silent content cannot function without text.
- Write the caption as a competent social media manager would — natural, specific to the content, no hollow hype. Avoid phrases like "game-changer", "this one's for you", "just dropped", "you need to see this."
- Respond ONLY with valid JSON. No markdown, no prose, no backticks.`;
}

function buildUserPrompt(signals: VideoSignals): string {
  const aspectRatio = signals.width && signals.height
    ? `${signals.width}x${signals.height} (${
        signals.width < signals.height ? "vertical ✓" :
        signals.width === signals.height ? "square" :
        "HORIZONTAL — will be letterboxed or cropped on Reels/TikTok"
      })`
    : "unknown";

  const durationNote = signals.duration
    ? `${signals.duration.toFixed(1)}s — ${
        signals.duration <= 7  ? "very short, hook must land in first second" :
        signals.duration <= 15 ? "short-form sweet spot, high retention potential" :
        signals.duration <= 30 ? "mid-length, needs strong mid-point re-engagement" :
        signals.duration <= 60 ? "long for Reels, must justify every second" :
        signals.duration <= 90 ? "near Reels 90s limit, justify length with story" :
        "OVER 90s — exceeds Reels limit, will not post as-is"
      }`
    : "unknown";

  // Audio context block — drives caption recommendation logic
  const audioContext = (() => {
    const type = signals.audioType ?? "unknown";
    const bpm = signals.audioBpm ? Math.round(signals.audioBpm) : null;
    const hasTranscript = !!signals.transcript;

    let captionImplication = "";
    if (type === "music") {
      captionImplication = "Music-only track — on-screen text is the ONLY way to communicate messaging. Captions are mandatory for campaign readiness.";
    } else if (type === "speech") {
      captionImplication = hasTranscript
        ? "Speech detected with transcript — captions needed for the ~70% of viewers watching sound-off."
        : "Speech detected but no transcript captured — caption status unknown. Captions critical for sound-off viewers.";
    } else if (type === "mixed") {
      captionImplication = "Mixed audio (speech + music) — captions needed to ensure dialogue is legible over the music track.";
    } else if (type === "silent") {
      captionImplication = "No audio detected — text overlays carry the entire messaging burden. Missing captions means no communication.";
    } else {
      captionImplication = "Audio type unknown — caption status cannot be assessed.";
    }

    return `- Has audio: ${signals.hasAudio ?? "unknown"}
- Audio type: ${type}
- Estimated BPM: ${bpm ?? "unknown"}
- Caption implication: ${captionImplication}`;
  })();

  return `VIDEO METADATA:
- Filename: ${signals.fileName}
- Type: ${signals.fileType}
- Size: ${signals.fileSizeMb.toFixed(1)} MB
- Duration: ${durationNote}
- Dimensions: ${aspectRatio}
- FPS: ${signals.fps ?? "unknown"}

AUDIO:
${audioContext}

CONTENT SIGNALS:
- On-screen text/captions detected: ${signals.hasOnScreenText != null ? (signals.hasOnScreenText ? "yes" : "no") : "unknown"}
- Speech transcript: ${signals.transcript ? `"${signals.transcript.slice(0, 600)}${signals.transcript.length > 600 ? "..." : ""}"` : "none provided"}

USER CONTEXT:
- Niche: ${signals.niche || "not specified"}
- Target audience: ${signals.targetAudience || "not specified"}

${signals.frames?.length
  ? `VISUAL FRAMES: ${signals.frames.length} frame(s) attached in order. Describe only what is clearly visible. Do not name people, brands, or text unless unambiguously legible in the frame.`
  : "VISUAL FRAMES: none provided."}

Analyze this video for campaign readiness. Deliver a frank, specific assessment:
- Lead with what the evidence actually shows, not what could theoretically work.
- Flag format, duration, caption, and audio issues with their specific viewer impact.
- If frames are provided, reference what you see in the opening frame for the hook assessment.
- If transcript is provided, quote or paraphrase specific language when assessing messaging clarity.
- Caption tip must reflect the audio type above — do not give generic "add captions" advice.
- One tip should address what to confirm with the creator before a brand meeting, if relevant.

For the caption field: write a ready-to-post caption that matches the content's actual tone (fashion/nostalgic = evocative and specific, not hype-y; fitness = energetic but grounded; B2B = clear and direct). Use 1–3 relevant emojis maximum. 60–110 words. Hook first sentence, natural CTA at the end. No hollow phrases.

Respond with ONLY this JSON:
{
  "score": <integer 1-100>,
  "verdict": "<2–4 word verdict — specific, not generic>",
  "desc": "<2 sentences: what the evidence shows and what the main campaign risk is>",
  "hook": "<3 sentences grounded in first-frame or transcript evidence; state clearly if opening is not visible>",
  "audio": "<3 sentences using actual audio type, BPM, and caption implication above; do not describe sounds that were not detected>",
  "tips": [
    "<specific, evidence-backed action — reference an actual signal from above>",
    "<tip 2>",
    "<tip 3>",
    "<tip 4>",
    "<tip 5>"
  ],
  "caption": "<ready-to-post caption, tone-matched to content, no hollow hype, 60–110 words>",
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
  const userContent: Anthropic.MessageParam["content"] = [];

  if (signals.frames?.length) {
    for (const frame of signals.frames.slice(0, 5)) {
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

  userContent.push({ type: "text", text: buildUserPrompt(signals) });

  const tools: Anthropic.Tool[] = useWebSearch
    ? [
        {
          name: "web_search",
          description: "Search for current hashtag, audio trend, or platform references when evidence requires current data",
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
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: userContent }],
    ...(tools.length > 0 ? { tools } : {}),
  });

  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("");

  const clean = rawText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: Omit<AnalysisResult, "inputTokens" | "outputTokens">;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("Failed to parse AI response as JSON");
    parsed = JSON.parse(match[0]);
  }

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

export function estimateCostCents(inputTokens: number, outputTokens: number): number {
  const inputCost  = (inputTokens  / 1_000_000) * 300;
  const outputCost = (outputTokens / 1_000_000) * 1500;
  return Math.ceil(inputCost + outputCost);
}
