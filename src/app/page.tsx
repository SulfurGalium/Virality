"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

type TimingSlot = {
  time: string;
  label: string;
  strength: number;
};

type AnalysisResult = {
  score: number;
  verdict: string;
  desc: string;
  hook: string;
  audio: string;
  tips: string[];
  caption: string;
  hashtags: string[];
  timing?: TimingSlot[];
};

type UploadDraft = {
  fileMeta: { name: string; sizeMb: number; type: string } | null;
  niche: string;
  targetAudience: string;
  result: AnalysisResult | null;
};

type ApiResponse = {
  error?: string;
  upgradeUrl?: string;
  result?: AnalysisResult;
};

// Fixed: was "hypr-marketing-upload-draft" — leaked internal project name
// into every user's browser localStorage
const DRAFT_KEY = "virality-upload-draft";
const MAX_VIDEO_MB = 500;
const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/x-matroska"];

// How many times the client will auto-retry on a 503 (account sync in progress)
const MAX_SYNC_RETRIES = 4;
const SYNC_RETRY_DELAY_MS = 2000;

function formatMb(sizeMb: number) {
  return `${sizeMb.toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

async function readApiResponse(res: Response): Promise<ApiResponse> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { error: res.ok ? undefined : `Unexpected server response (${res.status}).` };
  }

  try {
    return (await res.json()) as ApiResponse;
  } catch {
    return { error: "The server returned malformed JSON. Please try again." };
  }
}

function validateVideo(file: File): string | null {
  if (!file.type.startsWith("video/")) {
    return "Choose a valid video file.";
  }

  if (file.size <= 0) {
    return "That file appears to be empty.";
  }

  const sizeMb = file.size / 1024 / 1024;
  if (sizeMb > MAX_VIDEO_MB) {
    return `Videos must be ${MAX_VIDEO_MB} MB or smaller.`;
  }

  if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
    return "Use MP4, MOV, WEBM, AVI, or MKV for the most reliable analysis.";
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState<UploadDraft["fileMeta"]>(null);
  const [niche, setNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const canSubmit = Boolean(file) && !loading;
  const scoreLabel = useMemo(() => {
    if (!result) return "";
    if (result.score >= 80) return "Strong";
    if (result.score >= 60) return "Promising";
    if (result.score >= 40) return "Needs edits";
    return "High risk";
  }, [result]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (!saved) return;

      const draft = JSON.parse(saved) as UploadDraft;
      setFileMeta(draft.fileMeta);
      setNiche(draft.niche ?? "");
      setTargetAudience(draft.targetAudience ?? "");
      setResult(draft.result ?? null);

      if (draft.fileMeta) {
        setNotice("Your draft details were restored. Reselect the video file before running analysis.");
      }
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const draft: UploadDraft = { fileMeta, niche, targetAudience, result };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [fileMeta, niche, targetAudience, result]);

  useEffect(() => {
    const warnBeforeExit = (event: BeforeUnloadEvent) => {
      if (!file && !loading) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeExit);
    return () => window.removeEventListener("beforeunload", warnBeforeExit);
  }, [file, loading]);

  useEffect(() => {
    if (!result) return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  function resetUpload() {
    setFile(null);
    setFileMeta(null);
    setNiche("");
    setTargetAudience("");
    setResult(null);
    setError(null);
    setNotice(null);
    window.localStorage.removeItem(DRAFT_KEY);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFile(nextFile: File | null) {
    setError(null);
    setNotice(null);
    setResult(null);
    setFile(null);

    if (!nextFile) {
      setFileMeta(null);
      return;
    }

    const validationError = validateVideo(nextFile);
    const nextMeta = {
      name: nextFile.name,
      sizeMb: nextFile.size / 1024 / 1024,
      type: nextFile.type || "video/unknown",
    };

    setFileMeta(nextMeta);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(nextFile);
  }

  async function analyze() {
    if (!file) {
      setError(fileMeta ? "Reselect the video file, then analyze again." : "Choose a video first.");
      return;
    }

    const validationError = validateVideo(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    // Fixed: clearer, more reassuring notice during the 60-second wait
    setNotice("Analyzing your video — this takes 30–60 seconds. Keep this tab open.");
    setResult(null);

    const requestBody = JSON.stringify({
      fileName: file.name,
      fileType: file.type || "video/mp4",
      fileSizeMb: file.size / 1024 / 1024,
      niche: niche.trim(),
      targetAudience: targetAudience.trim(),
      transcript: "",
      hasOnScreenText: false,
    });

    try {
      let res: Response | null = null;
      let body: ApiResponse = {};

      // Auto-retry on 503: the server returns this when the Clerk webhook
      // hasn't synced the user record yet (common on first sign-up).
      // Retry-After header says 2 seconds; we honour that.
      for (let attempt = 0; attempt <= MAX_SYNC_RETRIES; attempt++) {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });

        if (res.status !== 503) break;

        // On last attempt don't sleep — just fall through to error handling
        if (attempt < MAX_SYNC_RETRIES) {
          setNotice(`Setting up your account — retrying in ${SYNC_RETRY_DELAY_MS / 1000}s…`);
          await sleep(SYNC_RETRY_DELAY_MS);
          setNotice("Analyzing your video — this takes 30–60 seconds. Keep this tab open.");
        }
      }

      body = await readApiResponse(res!);

      if (!res!.ok || !body.result) {
        throw new Error(body.error ?? "Analysis failed. Please try again.");
      }

      setResult(body.result);
      setNotice(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setNotice(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyCaption() {
    if (!result?.caption) return;

    try {
      await navigator.clipboard.writeText(result.caption);
      setNotice("Caption copied.");
    } catch {
      setError("Clipboard access was blocked. Select and copy the caption manually.");
    }
  }

  return (
    <main className="site-page" id="main-content">
      <a className="skip-link" href="#analysis-form">Skip to video analysis form</a>
      <header className="top-nav" aria-label="Primary navigation">
        <Link href="/" className="brand" aria-label="Home">
          <span className="brand-mark" aria-hidden="true">h</span>
          hypr marketing
        </Link>
        <nav className="nav-actions">
          <Link href="/pricing" className="nav-link">Pricing</Link>
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="button button-ghost" type="button">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="button button-primary" type="button">Get started</button>
              </SignUpButton>
            </>
          )}
        </nav>
      </header>

      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">Creator marketing command center</p>
          <h1>Plan sharper content today. Book creator meetings next.</h1>
          <p className="lead">
            hypr marketing helps teams evaluate short-form videos with specific, fact-based
            recommendations. Soon, you will also be able to schedule meetings directly with
            creators who fit your audience and campaign goals.
          </p>
          <div className="trust-row" aria-label="Product highlights">
            <span>Private analysis</span>
            <span>Creator meetings coming soon</span>
            <span>Campaign-ready next steps</span>
          </div>
        </div>

        <section className="analysis-panel" id="analysis-form" aria-labelledby="analysis-heading">
          {!isLoaded ? (
            <div className="loading-state" role="status">Loading secure sign-in...</div>
          ) : isSignedIn ? (
            <>
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Analyze</p>
                  <h2 id="analysis-heading">Upload your next short-form video</h2>
                </div>
                <span className="panel-limit">Max {MAX_VIDEO_MB} MB</span>
              </div>

              <label className="drop-zone" htmlFor="video-upload">
                <input
                  id="video-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,video/*"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  aria-describedby="video-upload-help"
                />
                <span className="drop-title">{fileMeta ? fileMeta.name : "Choose a video file"}</span>
                <span className="drop-sub" id="video-upload-help">
                  {fileMeta
                    ? `${formatMb(fileMeta.sizeMb)} - ${fileMeta.type}`
                    : "MP4, MOV, WEBM, AVI, or MKV works best."}
                </span>
              </label>

              {fileMeta && !file && !error && (
                <p className="helper-text">Browser privacy rules require reselecting the file after reload.</p>
              )}

              <div className="field-grid">
                <label className="field">
                  <span>Niche</span>
                  <input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value.slice(0, 50))}
                    placeholder="fitness, food, SaaS, beauty"
                    maxLength={50}
                    autoComplete="organization-title"
                  />
                </label>
                <label className="field">
                  <span>Audience</span>
                  <input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value.slice(0, 200))}
                    placeholder="busy founders, new moms"
                    maxLength={200}
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="button-row">
                <button
                  className="button button-primary button-wide"
                  onClick={analyze}
                  disabled={!canSubmit}
                  type="button"
                  aria-busy={loading}
                >
                  {loading ? "Analyzing…" : "Analyze video"}
                </button>
                <button className="button button-ghost" onClick={resetUpload} disabled={loading} type="button">
                  Clear
                </button>
              </div>

              <div className="status-stack" aria-live="polite">
                {notice && <p className="notice">{notice}</p>}
                {error && (
                  <div className="error-box" role="alert">
                    <span>{error}</span>
                    {error.toLowerCase().includes("limit") && (
                      <Link href="/pricing">View plans</Link>
                    )}
                  </div>
                )}
              </div>

              {result && (
                <div className="result-panel" ref={resultRef}>
                  <div className="score-card">
                    <div className="score-ring" aria-label={`Content performance score ${result.score} out of 100`}>
                      {result.score}
                    </div>
                    <div>
                      <p className="score-label">{scoreLabel}</p>
                      <h3>{result.verdict}</h3>
                      <p>{result.desc}</p>
                    </div>
                  </div>

                  <div className="result-grid">
                    <article>
                      <h4>Hook</h4>
                      <p>{result.hook}</p>
                    </article>
                    <article>
                      <h4>Audio and pacing</h4>
                      <p>{result.audio}</p>
                    </article>
                  </div>

                  {result.tips?.length > 0 && (
                    <article className="result-section">
                      <h4>Next edits</h4>
                      <ol>
                        {result.tips.map((tip) => <li key={tip}>{tip}</li>)}
                      </ol>
                    </article>
                  )}

                  <article className="caption-card">
                    <div className="caption-head">
                      <h4>Caption</h4>
                      <button className="small-action" type="button" onClick={copyCaption}>Copy</button>
                    </div>
                    <p>{result.caption}</p>
                  </article>

                  {result.hashtags?.length > 0 && (
                    <div className="tag-list" aria-label="Suggested hashtags">
                      {result.hashtags.map((tag) => (
                        <span key={tag}>#{tag.replace(/^#/, "")}</span>
                      ))}
                    </div>
                  )}

                  {result.timing && result.timing.length > 0 && (
                    <article className="result-section">
                      <h4>Posting windows</h4>
                      <div className="timing-list">
                        {result.timing.map((slot) => (
                          <div key={`${slot.time}-${slot.label}`}>
                            <span>{slot.time}</span>
                            <strong>{slot.label}</strong>
                            <meter
                              min={0}
                              max={100}
                              value={slot.strength}
                              aria-label={`${slot.label} strength ${slot.strength} out of 100`}
                            />
                          </div>
                        ))}
                      </div>
                    </article>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="signed-out-card">
              <p className="panel-kicker">Secure MVP access</p>
              <h2>Sign in to analyze your first video</h2>
              <p>
                Your report history, quota, and billing stay tied to your account so a refresh
                or device change does not strand your work.
              </p>
              <SignUpButton mode="modal">
                <button className="button button-primary button-wide" type="button">Create free account</button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="button button-ghost button-wide" type="button">I already have an account</button>
              </SignInButton>
            </div>
          )}
        </section>
      </section>

      <section className="seo-band" aria-labelledby="why-heading">
        <div>
          <p className="eyebrow">Built for creator workflow</p>
          <h2 id="why-heading">One place to evaluate content and coordinate creator conversations.</h2>
        </div>
        <div className="feature-grid">
          <article>
            <h3>Fact-based analysis</h3>
            <p>Review format, duration, transcript, frames, audio signals, captions, and audience context together.</p>
          </article>
          <article>
            <h3>Creator fit</h3>
            <p>Prepare briefs around the audience, offer, and content style before creator outreach begins.</p>
          </article>
          <article>
            <h3>Meetings soon</h3>
            <p>Upcoming scheduling will help teams move from analysis to live conversations with selected creators.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
