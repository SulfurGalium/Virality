// src/lib/videoProcessor.ts
// Runs entirely in the browser — no server needed.
// Extracts frames, metadata, and audio signals from a File object.
//
// Browser compatibility note:
// Chromium on Windows does not support .mov (QuickTime) in HTMLVideoElement.
// When video element loading fails, we fall back to audio-only extraction
// via the Web Audio API, which reads the raw ArrayBuffer and works on all
// formats. Frames are skipped for unsupported formats.

export interface ProcessedVideo {
  fileName: string;
  fileType: string;
  fileSizeMb: number;
  duration: number | undefined;
  width: number | undefined;
  height: number | undefined;
  fps: number | undefined;
  hasAudio: boolean;
  audioType: "music" | "speech" | "mixed" | "silent";
  audioBpm: number | null;
  hasOnScreenText: boolean | null;
  frames: Array<{ timestamp: number; base64: string }>;
  objectUrl: string;
}

// ─── Format support detection ────────────────────────────────────────────────

function canBrowserPlayType(mimeType: string): boolean {
  try {
    const video = document.createElement("video");
    const support = video.canPlayType(mimeType);
    return support === "probably" || support === "maybe";
  } catch {
    return false;
  }
}

// Returns true if we expect the video element to load this file successfully
function isVideoElementSupported(file: File): boolean {
  const type = file.type.toLowerCase();

  // .mov files report as video/quicktime — Chromium on Windows cannot play these
  if (type === "video/quicktime") return false;

  // x-msvideo (.avi) is also widely unsupported in browsers
  if (type === "video/x-msvideo") return false;

  // x-matroska (.mkv) — limited support
  if (type === "video/x-matroska") return false;

  // For everything else, ask the browser directly
  if (type) return canBrowserPlayType(type);

  // Unknown type — try anyway
  return true;
}

// ─── Main processor ──────────────────────────────────────────────────────────

export async function processVideo(
  file: File,
  options: {
    extractFrames?: boolean;
    analyzeAudio?: boolean;
    maxFrames?: number;
  } = {}
): Promise<ProcessedVideo> {
  const { extractFrames = true, analyzeAudio = true, maxFrames = 5 } = options;

  const objectUrl = URL.createObjectURL(file);
  const supported = isVideoElementSupported(file);

  let duration: number | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let fps: number | undefined;
  let frames: Array<{ timestamp: number; base64: string }> = [];

  if (supported) {
    // Happy path: browser can play this format
    try {
      const video = await loadVideoElement(objectUrl);
      duration = isFinite(video.duration) ? video.duration : undefined;
      width    = video.videoWidth  || undefined;
      height   = video.videoHeight || undefined;
      fps      = 30; // browser can't reliably report FPS; 30 is a safe default

      if (extractFrames && duration && duration > 0) {
        frames = await extractVideoFrames({ video, duration, maxFrames });
      }
    } catch (err) {
      // Video element failed even for an ostensibly supported type — continue
      console.warn("[videoProcessor] Video element failed for supported type:", err);
    }
  } else {
    // Unsupported format (e.g. .mov on Chromium/Windows):
    // We can still get file size and will try audio extraction below.
    // Duration/dimensions/frames will be unknown — the AI prompt handles this.
    console.warn(`[videoProcessor] Format ${file.type} not supported by this browser for video element. Attempting audio-only extraction.`);
  }

  // Audio extraction via Web Audio API — works on most formats regardless
  // of video element support, because it reads raw ArrayBuffer
  let hasAudio = false;
  let audioType: ProcessedVideo["audioType"] = "silent";
  let audioBpm: number | null = null;

  if (analyzeAudio) {
    try {
      const audioResult = await analyzeAudioTrack(file);
      hasAudio  = audioResult.hasAudio;
      audioType = audioResult.audioType;
      audioBpm  = audioResult.bpm;
    } catch (audioErr) {
      console.warn("[videoProcessor] Audio analysis failed:", audioErr);
    }
  }

  return {
    fileName:       file.name,
    fileType:       file.type || "video/unknown",
    fileSizeMb:     file.size / 1024 / 1024,
    duration,
    width,
    height,
    fps,
    hasAudio,
    audioType,
    audioBpm,
    hasOnScreenText: null,
    frames,
    objectUrl,
  };
}

// ─── Load video into hidden element ─────────────────────────────────────────

function loadVideoElement(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src         = url;
    video.muted       = true;
    video.playsInline = true;
    video.preload     = "metadata";
    // crossOrigin intentionally omitted — blob: URLs are same-origin by definition
    // and setting crossOrigin="anonymous" causes Chromium on Windows to fire onerror
    // immediately, breaking metadata extraction for MP4/WEBM files.

    video.onloadedmetadata = () => resolve(video);
    video.onerror          = () => reject(new Error("Failed to load video metadata"));

    setTimeout(() => reject(new Error("Video metadata load timeout")), 15_000);
  });
}

// ─── Frame extraction ────────────────────────────────────────────────────────

async function extractVideoFrames({
  video,
  duration,
  maxFrames,
}: {
  video: HTMLVideoElement;
  duration: number;
  maxFrames: number;
}): Promise<Array<{ timestamp: number; base64: string }>> {
  const timestamps = pickTimestamps(duration, maxFrames);
  const canvas = document.createElement("canvas");
  const ctx    = canvas.getContext("2d");
  if (!ctx) return [];

  const scale    = Math.min(1, 720 / (video.videoWidth || 720));
  canvas.width   = Math.round((video.videoWidth  || 720) * scale);
  canvas.height  = Math.round((video.videoHeight || 1280) * scale);

  const frames: Array<{ timestamp: number; base64: string }> = [];

  for (const ts of timestamps) {
    try {
      await seekTo(video, ts);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
      if (base64) frames.push({ timestamp: ts, base64 });
    } catch {
      console.warn(`[videoProcessor] Frame extraction failed at ${ts}s`);
    }
  }

  return frames;
}

function pickTimestamps(duration: number, max: number): number[] {
  if (duration <= 0) return [];
  const targets = [
    0.5,
    Math.min(1.5, duration * 0.1),
    Math.min(3,   duration * 0.15),
    duration * 0.5,
    Math.max(0, duration - 1),
  ];
  return [...new Set(targets.map((t) => Math.min(t, duration - 0.1)))]
    .filter((t) => t >= 0)
    .slice(0, max);
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Seek to ${time}s timed out`)),
      5000
    );
    video.onseeked = () => { clearTimeout(timeout); resolve(); };
    video.onerror  = () => { clearTimeout(timeout); reject(new Error("Seek error")); };
    video.currentTime = time;
  });
}

// ─── Audio analysis ──────────────────────────────────────────────────────────
// Uses Web Audio API which decodes raw audio regardless of container format.
// This works for .mov, .avi, .mkv where the video element fails.

async function analyzeAudioTrack(file: File): Promise<{
  hasAudio: boolean;
  audioType: ProcessedVideo["audioType"];
  bpm: number | null;
}> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return { hasAudio: false, audioType: "silent", bpm: null };

  const audioCtx = new AudioCtx();

  try {
    // Read only the first 10MB for audio analysis — avoids memory issues on large files
    const slice    = file.slice(0, Math.min(file.size, 10 * 1024 * 1024));
    const buffer   = await slice.arrayBuffer();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(buffer);
    } catch {
      // Format not decodable by Web Audio — treat as silent
      await audioCtx.close();
      return { hasAudio: false, audioType: "silent", bpm: null };
    }

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate  = audioBuffer.sampleRate;

    // RMS amplitude check
    const sampleStep = Math.max(1, Math.floor(channelData.length / 10_000));
    let sumSq = 0;
    let count = 0;
    for (let i = 0; i < channelData.length; i += sampleStep) {
      sumSq += channelData[i] ** 2;
      count++;
    }
    const rms = Math.sqrt(sumSq / count);

    if (rms < 0.001) {
      await audioCtx.close();
      return { hasAudio: false, audioType: "silent", bpm: null };
    }

    const bpm      = estimateBpm(channelData, sampleRate);
    const variance = computeVariance(channelData);

    let audioType: ProcessedVideo["audioType"];
    if (bpm && bpm > 60 && variance > 0.01)  audioType = "music";
    else if (variance < 0.005)               audioType = "speech";
    else if (bpm && bpm > 60)               audioType = "mixed";
    else                                     audioType = "speech";

    await audioCtx.close();
    return { hasAudio: true, audioType, bpm };

  } catch (err) {
    console.warn("[videoProcessor] Audio analysis error:", err);
    try { await audioCtx.close(); } catch { /* ignore */ }
    return { hasAudio: false, audioType: "silent", bpm: null };
  }
}

function computeVariance(data: Float32Array): number {
  const step    = Math.max(1, Math.floor(data.length / 1000));
  const samples = Array.from({ length: 1000 }, (_, i) => data[i * step] ?? 0);
  const mean    = samples.reduce((a, b) => a + Math.abs(b), 0) / samples.length;
  return samples.reduce((a, b) => a + (Math.abs(b) - mean) ** 2, 0) / samples.length;
}

function estimateBpm(channelData: Float32Array, sampleRate: number): number | null {
  try {
    const windowSize     = Math.floor(sampleRate * 0.01);
    const energyEnvelope: number[] = [];

    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) energy += channelData[i + j] ** 2;
      energyEnvelope.push(Math.sqrt(energy / windowSize));
    }

    const avg       = energyEnvelope.reduce((a, b) => a + b, 0) / energyEnvelope.length;
    const threshold = avg * 1.5;
    const peaks: number[] = [];
    let lastPeak = -100;

    for (let i = 1; i < energyEnvelope.length - 1; i++) {
      if (
        energyEnvelope[i] > threshold &&
        energyEnvelope[i] > energyEnvelope[i - 1] &&
        energyEnvelope[i] > energyEnvelope[i + 1] &&
        i - lastPeak > 20
      ) {
        peaks.push(i);
        lastPeak = i;
      }
    }

    if (peaks.length < 4) return null;

    const intervals     = peaks.slice(1).map((p, i) => p - peaks[i]);
    const avgInterval   = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const secondsPerBeat = (avgInterval * windowSize) / sampleRate;
    const bpm           = Math.round(60 / secondsPerBeat);

    return bpm >= 50 && bpm <= 220 ? bpm : null;
  } catch {
    return null;
  }
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export function releaseVideo(objectUrl: string) {
  URL.revokeObjectURL(objectUrl);
}
