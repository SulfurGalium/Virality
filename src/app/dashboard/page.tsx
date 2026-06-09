"use client";
// src/app/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface UserData {
  user: {
    plan: string;
    planName: string;
    subscriptionStatus: string | null;
    trialEndsAt: string | null;
    isOnTrial: boolean;
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
        if (!r.ok) {
          throw new Error(body.error ?? "Failed to load dashboard.");
        }
        return body as UserData;
      })
      .then((body) => {
        setData(body);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      })
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
      <div style={s.page}>
        <div style={s.skeleton} />
        <div style={{ ...s.skeleton, width: "60%", marginTop: 12 }} />
      </div>
    );
  }

  if (error) return <div style={s.page}>{error}. Please refresh.</div>;
  if (!data?.user) return <div style={s.page}>Dashboard data was incomplete. Please refresh.</div>;

  const { user, analyses, pagination } = data;
  const usagePct =
    user.usage.limit === -1
      ? 0
      : Math.round((user.usage.thisMonth / user.usage.limit) * 100);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Dashboard</h1>
          <p style={s.sub}>Welcome back, {clerkUser?.firstName ?? "creator"}</p>
        </div>
        <a href="/" style={s.primaryBtn}>New analysis →</a>
      </div>

      {/* Stats row */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Current plan</div>
          <div style={{ ...s.statValue, color: user.plan !== "FREE" ? "#FF2D55" : undefined }}>
            {user.planName}
            {user.isOnTrial && <span style={s.trialBadge}>Trial</span>}
          </div>
          {user.subscriptionStatus && (
            <div style={s.statSub}>{user.subscriptionStatus}</div>
          )}
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Analyses this month</div>
          <div style={s.statValue}>
            {user.usage.thisMonth}
            {user.usage.limit !== -1 && (
              <span style={s.statOf}> / {user.usage.limit}</span>
            )}
          </div>
          {user.usage.limit !== -1 && (
            <div style={s.progressWrap}>
              <div
                style={{
                  ...s.progressBar,
                  width: `${Math.min(100, usagePct)}%`,
                  background: usagePct > 80 ? "#FF2D55" : "linear-gradient(90deg,#FF2D55,#FF6B35)",
                }}
              />
            </div>
          )}
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>All-time analyses</div>
          <div style={s.statValue}>{user.usage.allTime}</div>
          <div style={s.statSub}>Total since joining</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>
            {user.usage.remaining === -1 ? "Remaining" : "Remaining this month"}
          </div>
          <div style={{ ...s.statValue, color: "#4ade80" }}>
            {user.usage.remaining === -1 ? "∞" : user.usage.remaining}
          </div>
          <div style={s.statSub}>
            Resets {new Date(user.usage.resetAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Upgrade CTA (free users) */}
      {user.plan === "FREE" && (
        <div style={s.upgradeBanner}>
          <div>
            <div style={s.upgradeTitle}>🚀 Unlock the full analysis</div>
            <div style={s.upgradeSub}>
              Pro plan adds frame-by-frame visual AI, speech transcription, trending hashtags, and PDF export — starting at $9/mo.
            </div>
          </div>
          <a href="/pricing" style={s.upgradeBtn}>See plans →</a>
        </div>
      )}

      {/* Billing */}
      {user.plan !== "FREE" && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Billing</div>
          <div style={s.billingRow}>
            <div>
              <div style={s.billingPlan}>{user.planName} plan</div>
              {user.trialEndsAt && (
                <div style={s.billingNote}>
                  Trial ends {new Date(user.trialEndsAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <button style={s.portalBtn} onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? "Opening..." : "Manage billing →"}
            </button>
          </div>
        </div>
      )}

      {/* Analysis history */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>Analysis history</div>
          <div style={s.sectionCount}>{pagination.total} total</div>
        </div>

        {analyses.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🎬</div>
            <div style={s.emptyTitle}>No analyses yet</div>
            <div style={s.emptySub}>Upload your first video to get started.</div>
            <a href="/" style={s.primaryBtn}>Analyze a video</a>
          </div>
        ) : (
          <div style={s.analysisList}>
            {analyses.map((a) => (
              <div key={a.id} style={s.analysisCard}>
                <div style={s.analysisLeft}>
                  <div style={s.scoreCircle}>
                    <span style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: a.score >= 70 ? "#4ade80" : a.score >= 40 ? "#FFCC00" : "#FF2D55"
                    }}>
                      {a.score}
                    </span>
                  </div>
                </div>
                <div style={s.analysisBody}>
                  <div style={s.analysisName}>{a.videoName}</div>
                  <div style={s.analysisVerdict}>{a.verdict}</div>
                  <div style={s.analysisDesc}>{a.description}</div>
                </div>
                <div style={s.analysisRight}>
                  <div style={s.analysisDate}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                  <a
                    href={`/report/${a.shareToken}`}
                    style={s.viewBtn}
                  >
                    View →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" },
  skeleton: { height: 32, background: "#1A1A1A", borderRadius: 8, width: "40%", animation: "pulse 1.5s infinite" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 },
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 4 },
  sub: { fontSize: 15, color: "#B8C0CA" },
  primaryBtn: { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "inline-block" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 24 },
  statCard: { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 16, padding: "20px" },
  statLabel: { fontSize: 12, color: "#AEB6C1", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, fontWeight: 500 },
  statValue: { fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1, marginBottom: 6 },
  statOf: { fontSize: 16, color: "#AEB6C1", fontWeight: 400 },
  statSub: { fontSize: 12, color: "#AEB6C1" },
  trialBadge: { marginLeft: 8, fontSize: 11, background: "rgba(255,204,0,.15)", color: "#FFCC00", padding: "2px 8px", borderRadius: 100, fontWeight: 600, verticalAlign: "middle" },
  progressWrap: { height: 4, background: "#2A2A2A", borderRadius: 100, overflow: "hidden", marginTop: 6 },
  progressBar: { height: "100%", borderRadius: 100, transition: "width .5s" },
  upgradeBanner: { background: "#130810", border: "1px solid rgba(255,45,85,.3)", borderRadius: 16, padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 24, flexWrap: "wrap" },
  upgradeTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  upgradeSub: { fontSize: 14, color: "#B8C0CA", lineHeight: 1.5 },
  upgradeBtn: { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" },
  section: { marginBottom: 40 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 700, marginBottom: 16 },
  sectionCount: { fontSize: 13, color: "#AEB6C1" },
  billingRow: { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  billingPlan: { fontSize: 15, fontWeight: 600 },
  billingNote: { fontSize: 13, color: "#AEB6C1", marginTop: 4 },
  portalBtn: { background: "#252525", border: "0.5px solid #333", borderRadius: 10, padding: "10px 18px", fontSize: 14, color: "#ccc", cursor: "pointer", fontFamily: "inherit" },
  analysisList: { display: "flex", flexDirection: "column", gap: 10 },
  analysisCard: { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 16, alignItems: "flex-start" },
  analysisLeft: { flexShrink: 0 },
  scoreCircle: { width: 52, height: 52, borderRadius: "50%", background: "#1E1E1E", border: "0.5px solid #333", display: "flex", alignItems: "center", justifyContent: "center" },
  analysisBody: { flex: 1, minWidth: 0 },
  analysisName: { fontSize: 14, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  analysisVerdict: { fontSize: 12, color: "#FF2D55", fontWeight: 600, marginBottom: 4 },
  analysisDesc: { fontSize: 13, color: "#AEB6C1", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  analysisRight: { flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" },
  analysisDate: { fontSize: 12, color: "#AEB6C1" },
  viewBtn: { fontSize: 13, color: "#B8C0CA", textDecoration: "none", padding: "6px 12px", border: "0.5px solid #2A2A2A", borderRadius: 8 },
  empty: { textAlign: "center", padding: "48px 24px", background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 16 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  emptySub: { fontSize: 14, color: "#AEB6C1", marginBottom: 20 },
};
