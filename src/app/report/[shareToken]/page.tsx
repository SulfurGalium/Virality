"use client";
// src/app/report/[shareToken]/page.tsx

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";

interface TimingSlot { time: string; label: string; strength: number; }

interface Analysis {
  id: string;
  videoName: string;
  score: number;
  verdict: string;
  description: string;
  hookAnalysis: string;
  audioAnalysis: string;
  tips: string[];
  caption: string;
  hashtags: string[];
  timing: TimingSlot[];
  createdAt: string;
}

export default function ReportPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/report/${shareToken}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Report not found.");
        return body as Analysis;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shareToken]);

  async function copyCaption() {
    if (!data?.caption) return;
    try {
      await navigator.clipboard.writeText(data.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed — select the caption text manually.");
    }
  }

  const scoreColor = !data ? "#ccc"
    : data.score >= 70 ? "#4ade80"
    : data.score >= 40 ? "#FFCC00"
    : "#FF2D55";

  const scoreLabel = !data ? ""
    : data.score >= 80 ? "Strong"
    : data.score >= 60 ? "Promising"
    : data.score >= 40 ? "Needs edits"
    : "High risk";

  return (
    <main id="main-content" style={s.page}>
      {/* Nav */}
      <nav style={s.nav} aria-label="Site navigation">
        <Link href="/" style={s.navBrand} aria-label="Hypr Marketing home">
          <span aria-hidden="true" style={s.brandMark}>h</span>
          Hypr Marketing
        </Link>
        <Link href="/dashboard" style={s.navLink}>← Back to dashboard</Link>
      </nav>

      {loading && (
        <div style={s.center} role="status" aria-live="polite">
          <div style={s.spinner} aria-hidden="true" />
          <p>Loading report…</p>
        </div>
      )}

      {error && (
        <div style={s.errorBox} role="alert">
          <p style={s.errorTitle}>Report not found</p>
          <p style={s.errorSub}>{error}</p>
          <Link href="/dashboard" style={s.btn}>Go to dashboard</Link>
        </div>
      )}

      {data && (
        <article aria-labelledby="report-title">
          <header style={s.reportHeader}>
            <div>
              <p style={s.eyebrow}>Analysis report</p>
              <h1 id="report-title" style={s.h1}>{data.videoName}</h1>
              <p style={s.dateLine}>
                Analyzed on {new Date(data.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div style={{ ...s.scoreRing, borderColor: scoreColor }} role="img" aria-label={`Virality score: ${data.score} out of 100 — ${scoreLabel}`}>
              <span style={{ ...s.scoreNum, color: scoreColor }}>{data.score}</span>
              <span style={s.scoreMax}>/100</span>
              <span style={{ ...s.scoreLabel, color: scoreColor }}>{scoreLabel}</span>
            </div>
          </header>

          <section style={s.card} aria-labelledby="verdict-heading">
            <h2 id="verdict-heading" style={s.cardTitle}>Verdict</h2>
            <p style={{ ...s.verdict, color: scoreColor }}>{data.verdict}</p>
            <p style={s.body}>{data.description}</p>
          </section>

          <div style={s.twoCol}>
            <section style={s.card} aria-labelledby="hook-heading">
              <h2 id="hook-heading" style={s.cardTitle}>Hook analysis</h2>
              <p style={s.body}>{data.hookAnalysis}</p>
            </section>
            <section style={s.card} aria-labelledby="audio-heading">
              <h2 id="audio-heading" style={s.cardTitle}>Audio &amp; pacing</h2>
              <p style={s.body}>{data.audioAnalysis}</p>
            </section>
          </div>

          {data.tips?.length > 0 && (
            <section style={s.card} aria-labelledby="tips-heading">
              <h2 id="tips-heading" style={s.cardTitle}>Next edits</h2>
              <ol style={s.tipList}>
                {data.tips.map((tip, i) => <li key={i} style={s.tipItem}>{tip}</li>)}
              </ol>
            </section>
          )}

          {data.caption && (
            <section style={s.card} aria-labelledby="caption-heading">
              <div style={s.cardTitleRow}>
                <h2 id="caption-heading" style={s.cardTitle}>Suggested caption</h2>
                <button style={s.copyBtn} onClick={copyCaption} type="button" aria-live="polite">
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p style={{ ...s.body, fontStyle: "italic" }}>{data.caption}</p>
            </section>
          )}

          {data.hashtags?.length > 0 && (
            <section style={s.card} aria-labelledby="hashtags-heading">
              <h2 id="hashtags-heading" style={s.cardTitle}>Suggested hashtags</h2>
              <div style={s.tagList} aria-label="Hashtag suggestions">
                {data.hashtags.map((tag) => <span key={tag} style={s.tag}>#{tag.replace(/^#/, "")}</span>)}
              </div>
            </section>
          )}

          {data.timing?.length > 0 && (
            <section style={s.card} aria-labelledby="timing-heading">
              <h2 id="timing-heading" style={s.cardTitle}>Best posting windows</h2>
              <div style={s.timingGrid}>
                {data.timing.map((slot) => (
                  <div key={`${slot.time}-${slot.label}`} style={s.timingSlot}>
                    <div style={s.timingTime}>{slot.time}</div>
                    <div style={s.timingLabel}>{slot.label}</div>
                    <div style={s.timingBarWrap} role="progressbar" aria-valuenow={slot.strength} aria-valuemin={0} aria-valuemax={100} aria-label={`${slot.label} strength: ${slot.strength}%`}>
                      <div style={{ ...s.timingBar, width: `${slot.strength}%` }} />
                    </div>
                    <div style={s.timingStrength}>{slot.strength}%</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div style={s.actions}>
            <Link href="/dashboard" style={s.btn}>← Back to dashboard</Link>
            <Link href="/" style={{ ...s.btn, ...s.btnSecondary }}>Analyze another video</Link>
          </div>
        </article>
      )}

      <SiteFooter />
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:          { maxWidth: 860, margin: "0 auto", padding: "0 24px 40px", fontFamily: "var(--font-inter,'Segoe UI',system-ui,sans-serif)" },
  nav:           { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 40px" },
  navBrand:      { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text)", fontWeight: 600, fontSize: 16 },
  brandMark:     { background: "linear-gradient(135deg,var(--accent),var(--accent-2))", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 },
  navLink:       { color: "var(--muted)", textDecoration: "none", fontSize: 14 },
  center:        { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: 16, color: "var(--muted)" },
  spinner:       { width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--line)", borderTopColor: "var(--accent)", animation: "spin 1s linear infinite" },
  errorBox:      { textAlign: "center" as const, padding: "64px 24px" },
  errorTitle:    { fontSize: 20, fontWeight: 600, marginBottom: 8 },
  errorSub:      { color: "var(--muted)", marginBottom: 24 },
  reportHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 24, flexWrap: "wrap" as const },
  eyebrow:       { fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--accent)", fontWeight: 600, marginBottom: 8 },
  h1:            { fontSize: "clamp(22px,4vw,34px)", fontWeight: 700, letterSpacing: -0.5, marginBottom: 8, lineHeight: 1.2 },
  dateLine:      { fontSize: 13, color: "var(--muted)" },
  scoreRing:     { flexShrink: 0, width: 100, height: 100, borderRadius: "50%", border: "3px solid", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", background: "var(--panel)" },
  scoreNum:      { fontSize: 28, fontWeight: 700, lineHeight: 1 },
  scoreMax:      { fontSize: 11, color: "var(--muted)" },
  scoreLabel:    { fontSize: 11, fontWeight: 600, marginTop: 2 },
  card:          { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px", marginBottom: 16 },
  cardTitleRow:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle:     { fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 14 },
  verdict:       { fontSize: 20, fontWeight: 700, marginBottom: 10 },
  body:          { fontSize: 15, color: "var(--soft)", lineHeight: 1.7, margin: 0 },
  twoCol:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 0 },
  tipList:       { paddingLeft: 20, margin: 0 },
  tipItem:       { fontSize: 15, color: "var(--soft)", lineHeight: 1.7, marginBottom: 8 },
  copyBtn:       { fontSize: 13, color: "var(--muted)", background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" },
  tagList:       { display: "flex", flexWrap: "wrap" as const, gap: 8 },
  tag:           { background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 100, padding: "4px 12px", fontSize: 13, color: "var(--muted)" },
  timingGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 },
  timingSlot:    { background: "var(--panel-2)", borderRadius: 10, padding: "14px" },
  timingTime:    { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  timingLabel:   { fontSize: 12, color: "var(--muted)", marginBottom: 8 },
  timingBarWrap: { height: 4, background: "var(--line)", borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  timingBar:     { height: "100%", background: "linear-gradient(90deg,var(--accent),var(--accent-2))", borderRadius: 2 },
  timingStrength:{ fontSize: 12, color: "var(--accent)", fontWeight: 600 },
  actions:       { display: "flex", gap: 12, flexWrap: "wrap" as const, marginTop: 24, marginBottom: 8 },
  btn:           { display: "inline-block", background: "linear-gradient(135deg,var(--accent),var(--accent-2))", color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none" },
  btnSecondary:  { background: "var(--panel-2)", border: "1px solid var(--line)" },
};
