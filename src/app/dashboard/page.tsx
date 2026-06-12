"use client";
// src/app/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface UserData {
  user: {
    plan: string;
    planName: string;
    subscriptionStatus: string | null;
    subscriptionEndsAt: string | null;
    usage: {
      thisMonth: number;
      allTime: number;
      limit: number;
      remaining: number;
      resetAt: string;
    };
  };
  analyses: Array<{
    id: string;
    videoName: string;
    score: number;
    verdict: string;
    description: string;
    shareToken: string;
    createdAt: string;
  }>;
  pagination: { total: number };
}

export default function DashboardPage() {
  const { user: clerkUser } = useUser();
  const [data, setData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Failed to load dashboard.");
        return body as UserData;
      })
      .then((body) => { setData(body); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <main id="main-content" style={s.page}>
        <div style={s.skeleton} aria-hidden="true" />
        <div style={{ ...s.skeleton, width: "55%", marginTop: 12 }} aria-hidden="true" />
        <p className="sr-only" role="status">Loading dashboard…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main-content" style={s.page}>
        <p role="alert" style={{ color: "#FF2D55" }}>{error} Please refresh.</p>
      </main>
    );
  }

  if (!data?.user) {
    return (
      <main id="main-content" style={s.page}>
        <p role="alert">Dashboard data was incomplete. Please refresh.</p>
      </main>
    );
  }

  const { user, analyses, pagination } = data;
  const usagePct = user.usage.limit === -1
    ? 0
    : Math.round((user.usage.thisMonth / user.usage.limit) * 100);

  return (
    <main id="main-content" style={s.page}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav style={s.nav} aria-label="Site navigation">
        <Link href="/" style={s.navBrand} aria-label="Hypr Marketing home">
          <span aria-hidden="true" style={s.brandMark}>h</span>
          Hypr Marketing
        </Link>
        <div style={s.navRight}>
          <Link href="/pricing" style={s.navLink}>Pricing</Link>
          {/* Bigger, clearer "New analysis" CTA */}
          <Link href="/" style={s.newAnalysisBtn} aria-label="Start a new video analysis">
            + New analysis
          </Link>
        </div>
      </nav>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>Dashboard</h1>
          <p style={s.sub}>Welcome back, {clerkUser?.firstName ?? "creator"}</p>
        </div>
      </header>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <section aria-label="Usage overview" style={s.statsRow}>
        <div style={s.statCard}>
          <p style={s.statLabel}>Current plan</p>
          <p style={{ ...s.statValue, color: user.plan !== "FREE" ? "#FF2D55" : undefined }}>
            {user.planName}
          </p>
          {user.subscriptionStatus && (
            <p style={s.statSub}>{user.subscriptionStatus}</p>
          )}
        </div>

        <div style={s.statCard}>
          <p style={s.statLabel}>Analyses this month</p>
          <p style={s.statValue}>
            {user.usage.thisMonth}
            {user.usage.limit !== -1 && (
              <span style={s.statOf}> / {user.usage.limit}</span>
            )}
          </p>
          {user.usage.limit !== -1 && (
            <div
              style={s.progressWrap}
              role="progressbar"
              aria-valuenow={usagePct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${usagePct}% of monthly analyses used`}
            >
              <div style={{
                ...s.progressBar,
                width: `${Math.min(100, usagePct)}%`,
                background: usagePct > 80 ? "#FF2D55" : "linear-gradient(90deg,#FF2D55,#FF6B35)",
              }} />
            </div>
          )}
        </div>

        <div style={s.statCard}>
          <p style={s.statLabel}>All-time analyses</p>
          <p style={s.statValue}>{user.usage.allTime}</p>
          <p style={s.statSub}>Total since joining</p>
        </div>

        <div style={s.statCard}>
          <p style={s.statLabel}>{user.usage.remaining === -1 ? "Remaining" : "Remaining this month"}</p>
          <p style={{ ...s.statValue, color: "#4ade80" }}>
            {user.usage.remaining === -1 ? "∞" : user.usage.remaining}
          </p>
          <p style={s.statSub}>
            Resets {new Date(user.usage.resetAt).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* ── Upgrade CTA (free users) ──────────────────────────────────────── */}
      {user.plan === "FREE" && (
        <section style={s.upgradeBanner} aria-label="Upgrade prompt">
          <div>
            <p style={s.upgradeTitle}>Unlock the full analysis</p>
            <p style={s.upgradeSub}>
              Pro adds frame-by-frame visual AI, speech transcription, trending hashtags,
              and PDF export — from $9/mo.
            </p>
          </div>
          <Link href="/pricing" style={s.upgradeBtn}>See plans →</Link>
        </section>
      )}

      {/* ── Billing (paid users) ─────────────────────────────────────────── */}
      {user.plan !== "FREE" && (
        <section style={s.section} aria-labelledby="billing-heading">
          <h2 id="billing-heading" style={s.sectionTitle}>Billing</h2>
          <div style={s.billingRow}>
            <div>
              <p style={s.billingPlan}>{user.planName} plan</p>
              {user.subscriptionEndsAt && (
                <p style={s.billingNote}>
                  Access until {new Date(user.subscriptionEndsAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              style={s.portalBtn}
              onClick={openPortal}
              disabled={portalLoading}
              type="button"
              aria-busy={portalLoading}
            >
              {portalLoading ? "Opening…" : "Manage billing →"}
            </button>
          </div>
        </section>
      )}

      {/* ── Analysis history ─────────────────────────────────────────────── */}
      <section style={s.section} aria-labelledby="history-heading">
        <div style={s.sectionHeader}>
          <h2 id="history-heading" style={s.sectionTitle}>Analysis history</h2>
          <p style={s.sectionCount} aria-live="polite">{pagination.total} total</p>
        </div>

        {analyses.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyIcon} aria-hidden="true">🎬</p>
            <p style={s.emptyTitle}>No analyses yet</p>
            <p style={s.emptySub}>Upload your first video to get started.</p>
            <Link href="/" style={s.primaryBtn}>Analyze a video</Link>
          </div>
        ) : (
          <ol style={s.analysisList} aria-label="Past analyses">
            {analyses.map((a) => (
              <li key={a.id} style={s.analysisCard}>
                <div style={s.analysisLeft}>
                  <div
                    style={s.scoreCircle}
                    aria-label={`Score: ${a.score} out of 100`}
                  >
                    <span style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: a.score >= 70 ? "#4ade80" : a.score >= 40 ? "#FFCC00" : "#FF2D55",
                    }}>
                      {a.score}
                    </span>
                  </div>
                </div>

                <div style={s.analysisBody}>
                  <p style={s.analysisName}>{a.videoName}</p>
                  <p style={s.analysisVerdict}>{a.verdict}</p>
                  <p style={s.analysisDesc}>{a.description}</p>
                </div>

                <div style={s.analysisRight}>
                  <p style={s.analysisDate}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                  {/* "View →" now links to the full report page */}
                  <Link
                    href={`/report/${a.shareToken}`}
                    style={s.viewBtn}
                    aria-label={`View full report for ${a.videoName}`}
                  >
                    View report →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ── ADA & Legal footer ───────────────────────────────────────────── */}
      <footer style={s.legalFooter} aria-label="Legal and accessibility">
        <div style={s.legalLinks}>
          <Link href="/legal/terms" style={s.legalLink}>Terms of Service</Link>
          <span aria-hidden="true" style={s.dot}>·</span>
          <Link href="/legal/privacy" style={s.legalLink}>Privacy Policy</Link>
          <span aria-hidden="true" style={s.dot}>·</span>
          <Link href="/legal/acceptable-use" style={s.legalLink}>Acceptable Use</Link>
          <span aria-hidden="true" style={s.dot}>·</span>
          <Link href="/legal/security" style={s.legalLink}>Security</Link>
        </div>
        <p style={s.legalNote}>
          Hypr Marketing targets WCAG 2.1 Level AA.{" "}
          <a href="mailto:accessibility@hyprmarketing.app" style={s.legalLink}>
            Report an accessibility issue
          </a>
          .
        </p>
      </footer>

    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:           { maxWidth: 900, margin: "0 auto", padding: "0 24px 80px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" },
  skeleton:       { height: 32, background: "#1A1A1A", borderRadius: 8, width: "40%" },
  nav:            { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 40px" },
  navBrand:       { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#F5F0E8", fontWeight: 600, fontSize: 16 },
  brandMark:      { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 },
  navRight:       { display: "flex", alignItems: "center", gap: 20 },
  navLink:        { color: "#B8C0CA", textDecoration: "none", fontSize: 14 },
  // Bigger, clearer CTA — this was the "not obvious enough" issue
  newAnalysisBtn: { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none", letterSpacing: 0.1 },
  header:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  h1:             { fontSize: 30, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 },
  sub:            { fontSize: 15, color: "#B8C0CA" },
  statsRow:       { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 24 },
  statCard:       { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 16, padding: "20px" },
  statLabel:      { fontSize: 12, color: "#AEB6C1", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 8, fontWeight: 500 },
  statValue:      { fontSize: 26, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1, marginBottom: 6 },
  statOf:         { fontSize: 16, color: "#AEB6C1", fontWeight: 400 },
  statSub:        { fontSize: 12, color: "#AEB6C1" },
  progressWrap:   { height: 4, background: "#2A2A2A", borderRadius: 100, overflow: "hidden", marginTop: 6 },
  progressBar:    { height: "100%", borderRadius: 100, transition: "width .5s" },
  upgradeBanner:  { background: "#130810", border: "1px solid rgba(255,45,85,.3)", borderRadius: 16, padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 24, flexWrap: "wrap" as const },
  upgradeTitle:   { fontSize: 16, fontWeight: 600, marginBottom: 6 },
  upgradeSub:     { fontSize: 14, color: "#B8C0CA", lineHeight: 1.6 },
  upgradeBtn:     { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" as const },
  section:        { marginBottom: 40 },
  sectionHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle:   { fontSize: 17, fontWeight: 600, marginBottom: 16 },
  sectionCount:   { fontSize: 13, color: "#AEB6C1" },
  billingRow:     { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" as const },
  billingPlan:    { fontSize: 15, fontWeight: 600 },
  billingNote:    { fontSize: 13, color: "#AEB6C1", marginTop: 4 },
  portalBtn:      { background: "#252525", border: "0.5px solid #333", borderRadius: 10, padding: "10px 18px", fontSize: 14, color: "#ccc", cursor: "pointer", fontFamily: "inherit" },
  analysisList:   { display: "flex", flexDirection: "column" as const, gap: 10, listStyle: "none", padding: 0, margin: 0 },
  analysisCard:   { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 16, alignItems: "flex-start" },
  analysisLeft:   { flexShrink: 0 },
  scoreCircle:    { width: 52, height: 52, borderRadius: "50%", background: "#1E1E1E", border: "0.5px solid #333", display: "flex", alignItems: "center", justifyContent: "center" },
  analysisBody:   { flex: 1, minWidth: 0 },
  analysisName:   { fontSize: 14, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" },
  analysisVerdict:{ fontSize: 12, color: "#FF2D55", fontWeight: 600, marginBottom: 4 },
  analysisDesc:   { fontSize: 13, color: "#AEB6C1", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" },
  analysisRight:  { flexShrink: 0, textAlign: "right" as const, display: "flex", flexDirection: "column" as const, gap: 8, alignItems: "flex-end" },
  analysisDate:   { fontSize: 12, color: "#AEB6C1" },
  // Bigger, more obvious "View report" button
  viewBtn:        { fontSize: 13, color: "#F5F0E8", textDecoration: "none", padding: "8px 14px", background: "#252525", border: "0.5px solid #3A3A3A", borderRadius: 8, whiteSpace: "nowrap" as const, fontWeight: 500 },
  primaryBtn:     { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-block" },
  empty:          { textAlign: "center" as const, padding: "48px 24px", background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 16 },
  emptyIcon:      { fontSize: 40, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: 600, marginBottom: 6 },
  emptySub:       { fontSize: 14, color: "#AEB6C1", marginBottom: 20 },
  legalFooter:    { borderTop: "0.5px solid #1E1E1E", paddingTop: 24, marginTop: 48 },
  legalLinks:     { display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 10, alignItems: "center" },
  legalLink:      { color: "#7E8793", textDecoration: "none", fontSize: 12 },
  dot:            { color: "#3A3A3A", fontSize: 12 },
  legalNote:      { fontSize: 12, color: "#555", lineHeight: 1.6 },
};
