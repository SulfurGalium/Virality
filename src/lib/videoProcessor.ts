// src/lib/videoProcessor.ts
// Runs entirely in the browser — no server needed
// Extracts frames, metadata, audio signals from a File object

export interface ProcessedVideo {
  // Metadata
  fileName: string;
  fileType: string;
  fileSizeMb: number;
  duration: number;
  width: number;
  height: number;
  fps: number;

  // Audio
  hasAudio: boolean;
  audioType: "music" | "speech" | "mixed" | "silent";
  audioBpm: number | null;

  // Visual
  hasOnScreenText: boolean | null; // null = couldn't determine
  frames: Array<{ timestamp: number; base64: string }>;

  // Raw video URL for display
  objectUrl: string;
}

// ─── Main processor ─────────────────────────────────────────────────────────

export async function processVideo(
  file: File,
  options: {
    extractFrames?: boolean;  // requires Pro
    analyzeAudio?: boolean;
    maxFrames?: number;
  } = {}
): Promise<ProcessedVideo> {
  const { extractFrames = true, analyzeAudio = true, maxFrames = 5 } = options;

  const objectUrl = URL.createObjectURL(file);
  const video = await loadVideoElement(objectUrl);

  const duration = video.duration;
  const width = video.videoWidth;
  const height = video.videoHeight;
  const fps = await estimateFps(video);

  let frames: Array<{ timestamp: number; base64: string }> = [];
  if (extractFrames && duration > 0) {
    frames = await extractFrames_({
      video,
      duration,
      maxFrames,
    });
  }

  let hasAudio = false;
  let audioType: ProcessedVideo["audioType"] = "silent";
  let audioBpm: number | null = null;

  if (analyzeAudio) {
    const audioResult = await analyzeAudioTrack(file);
    hasAudio = audioResult.hasAudio;
    audioType = audioResult.audioType;
    audioBpm = audioResult.bpm;
  }

  return {
    fileName: file.name,
    fileType: file.type,
    fileSizeMb: file.size / 1024 / 1024,
    duration,
    width,
    height,
    fps,
    hasAudio,
    audioType,
    audioBpm,
    hasOnScreenText: null, // determined by Claude vision
    frames,
    objectUrl,
  };
}

// ─── Load video into hidden element ─────────────────────────────────────────

function loadVideoElement(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("Failed to load video metadata"));

    // Timeout after 15s
    setTimeout(() => reject(new Error("Video metadata load timeout")), 15_000);
  });
}

// ─── FPS estimation ──────────────────────────────────────────────────────────

async function estimateFps(video: HTMLVideoElement): Promise<number> {
  // Most Instagram content is 30fps; we can't easily get this from the browser
  // without MediaInfo.js, so we return a sensible default
  if ("getVideoPlaybackQuality" in video) {
    try {
      // Play a tiny bit and count decoded frames
      video.currentTime = 0;
      await new Promise<void>((r) => {
        video.onseeked = () => r();
      });
    } catch { /* ignore */ }
  }
  return 30; // default assumption
}

// ─── Frame extraction ────────────────────────────────────────────────────────

async function extractFrames_({
  video,
  duration,
  maxFrames,
}: {
  video: HTMLVideoElement;
  duration: number;
  maxFrames: number;
}): Promise<Array<{ timestamp: number; base64: string }>> {
  // Pick strategic timestamps — weight toward beginning (hook is most important)
  const timestamps = pickTimestamps(duration, maxFrames);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Scale down for API efficiency — target ~720px wide max
  const scale = Math.min(1, 720 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const frames: Array<{ timestamp: number; base64: string }> = [];

  for (const ts of timestamps) {
    try {
      await seekTo(video, ts);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
      if (base64) frames.push({ timestamp: ts, base64 });
    } catch {
      console.warn(`[videoProcessor] Failed to extract frame at ${ts}s`);
    }
  }

  return frames;
}

function pickTimestamps(duration: number, max: number): number[] {
  if (duration <= 0) return [];

  const targets = [
    0.5,                          // hook start
    Math.min(1.5, duration * 0.1), // early hook
    Math.min(3, duration * 0.15),  // hook end
    duration * 0.5,               // midpoint
    Math.max(0, duration - 1),    // near end
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
    video.onerror = () => { clearTimeout(timeout); reject(new Error("Seek error")); };
    video.currentTime = time;
  });
}

// ─── Audio analysis ──────────────────────────────────────────────────────────

async function analyzeAudioTrack(file: File): Promise<{
  hasAudio: boolean;
  audioType: ProcessedVideo["audioType"];
  bpm: number | null;
}> {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    let audioBuffer: AudioBuffer;

    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      // Some video formats aren't decodable by Web Audio API
      return { hasAudio: false, audioType: "silent", bpm: null };
    }

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Check if audio is present (RMS amplitude)
    const rms = Math.sqrt(
      channelData.reduce((sum, s) => sum + s * s, 0) / channelData.length
    );

    if (rms < 0.001) {
      await audioCtx.close();
      return { hasAudio: false, audioType: "silent", bpm: null };
    }

    // Estimate BPM using onset detection
    const bpm = estimateBpm(channelData, sampleRate);

    // Classify audio type (naive heuristic)
    // - High BPM + consistent rhythm → music
    // - Low amplitude variance → speech
    // - Mixed → both
    const variance = computeVariance(channelData);
    let audioType: ProcessedVideo["audioType"];

    if (bpm && bpm > 60 && variance > 0.01) {
      audioType = "music";
    } else if (variance < 0.005) {
      audioType = "speech";
    } else if (bpm && bpm > 60) {
      audioType = "mixed";
    } else {
      audioType = "speech";
    }

    await audioCtx.close();
    return { hasAudio: true, audioType, bpm };
  } catch (err) {
    console.warn("[videoProcessor] Audio analysis failed:", err);
    return { hasAudio: false, audioType: "silent", bpm: null };
  }
}

function computeVariance(data: Float32Array): number {
  // Sample 1000 points for speed
  const step = Math.floor(data.length / 1000);
  const samples = Array.from({ length: 1000 }, (_, i) => data[i * step] ?? 0);
  const mean = samples.reduce((a, b) => a + Math.abs(b), 0) / samples.length;
  return samples.reduce((a, b) => a + Math.pow(Math.abs(b) - mean, 2), 0) / samples.length;
}

function estimateBpm(channelData: Float32Array, sampleRate: number): number | null {
  try {
    // Simple onset detection: count peaks in energy envelope
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
    const energyEnvelope: number[] = [];

    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] ** 2;
      }
      energyEnvelope.push(Math.sqrt(energy / windowSize));
    }

    // Find peaks (onsets)
    const threshold = energyEnvelope.reduce((a, b) => a + b, 0) / energyEnvelope.length * 1.5;
    const peaks: number[] = [];
    let lastPeak = -100;

    for (let i = 1; i < energyEnvelope.length - 1; i++) {
      if (
        energyEnvelope[i] > threshold &&
        energyEnvelope[i] > energyEnvelope[i - 1] &&
        energyEnvelope[i] > energyEnvelope[i + 1] &&
        i - lastPeak > 20 // min 200ms between peaks
      ) {
        peaks.push(i);
        lastPeak = i;
      }
    }

    if (peaks.length < 4) return null;

    // Average interval between peaks → BPM
    const intervals = peaks.slice(1).map((p, i) => p - peaks[i]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const secondsPerBeat = (avgInterval * windowSize) / sampleRate;
    const bpm = Math.round(60 / secondsPerBeat);

    // Sanity check: typical music is 60–200 BPM
    if (bpm < 50 || bpm > 220) return null;
    return bpm;
  } catch {
    return null;
  }
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export function releaseVideo(objectUrl: string) {
  URL.revokeObjectURL(objectUrl);
}
