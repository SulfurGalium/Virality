"use client";
// src/app/pricing/page.tsx

import { useState } from "react";
import { PLANS, formatPrice, yearlySavings } from "@/lib/plans";

const checkIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="currentColor" opacity=".15"/>
    <path d="M4.5 8l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const xIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const features = [
  { label: "Analyses per month", free: "4", pro: "100", agency: "Unlimited" },
  { label: "Frame-by-frame visual AI analysis", free: false, pro: true, agency: true },
  { label: "Speech transcription (Whisper)", free: false, pro: true, agency: true },
  { label: "Real-time trending hashtags", free: false, pro: true, agency: true },
  { label: "PDF report export", free: false, pro: true, agency: true },
  { label: "Analysis history", free: "7 days", pro: "1 year", agency: "Forever" },
  { label: "Shareable report links", free: false, pro: true, agency: true },
  { label: "API access", free: false, pro: false, agency: true },
  { label: "Support", free: "Community", pro: "Email", agency: "Priority" },
  { label: "7-day free trial", free: false, pro: true, agency: true },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(plan: "PRO" | "AGENCY") {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", plan, interval }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Something went wrong");
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.eyebrow}>Simple pricing</div>
        <h1 style={styles.h1}>Pay for what you actually use</h1>
        <p style={styles.sub}>
          Start free, no credit card required. Upgrade when you need more power.
        </p>

        {/* Interval toggle */}
        <div style={styles.toggleWrap}>
          <button
            style={{ ...styles.toggleBtn, ...(interval === "monthly" ? styles.toggleActive : {}) }}
            onClick={() => setInterval("monthly")}
            type="button"
            aria-pressed={interval === "monthly"}
          >
            Monthly
          </button>
          <button
            style={{ ...styles.toggleBtn, ...(interval === "yearly" ? styles.toggleActive : {}) }}
            onClick={() => setInterval("yearly")}
            type="button"
            aria-pressed={interval === "yearly"}
          >
            Yearly
            <span style={styles.saveBadge}>Save up to $189</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={styles.cardsRow}>
        {/* Free */}
        <div style={styles.card}>
          <div style={styles.planName}>Free</div>
          <div style={styles.price}>$0</div>
          <div style={styles.priceSub}>forever</div>
          <p style={styles.tagline}>Get a feel for what's possible.</p>
          <a href="/sign-up" style={{ ...styles.btn, ...styles.btnSecondary }}>
            Get started free
          </a>
          <div style={styles.limitNote}>4 analyses / month</div>
          <div style={styles.featureList}>
            <div style={styles.featRow}>{checkIcon}<span>Filename-based AI analysis</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Content score & verdict</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Caption & hashtag suggestions</span></div>
            <div style={styles.featRow}><span style={styles.xMuted}>{xIcon}</span><span style={styles.muted}>Frame extraction</span></div>
            <div style={styles.featRow}><span style={styles.xMuted}>{xIcon}</span><span style={styles.muted}>Transcription</span></div>
            <div style={styles.featRow}><span style={styles.xMuted}>{xIcon}</span><span style={styles.muted}>PDF export</span></div>
          </div>
        </div>

        {/* Pro */}
        <div style={{ ...styles.card, ...styles.cardFeatured }}>
          <div style={styles.badge}>Most popular</div>
          <div style={styles.planName}>Pro</div>
          <div style={styles.price}>
            {interval === "yearly"
              ? `$${(7900 / 100 / 12).toFixed(2)}`
              : "$9"}
          </div>
          <div style={styles.priceSub}>
            {interval === "yearly" ? "per month, billed $79/yr" : "per month"}
          </div>
          {interval === "yearly" && (
            <div style={styles.savings}>
              You save ${yearlySavings("PRO") / 100}/yr
            </div>
          )}
          <p style={styles.tagline}>For serious creators who want real results.</p>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={() => handleUpgrade("PRO")}
            disabled={loading === "PRO"}
            type="button"
          >
            {loading === "PRO" ? "Loading..." : "Start 7-day free trial"}
          </button>
          <div style={styles.limitNote}>100 analyses / month · 7-day trial</div>
          <div style={styles.featureList}>
            <div style={styles.featRow}>{checkIcon}<span>Everything in Free</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Frame-by-frame visual analysis</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Speech transcription (Whisper)</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Real-time trending hashtags</span></div>
            <div style={styles.featRow}>{checkIcon}<span>PDF report export</span></div>
            <div style={styles.featRow}>{checkIcon}<span>1-year analysis history</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Shareable report links</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Email support</span></div>
          </div>
        </div>

        {/* Agency */}
        <div style={styles.card}>
          <div style={styles.planName}>Agency</div>
          <div style={styles.price}>
            {interval === "yearly"
              ? `$${(39900 / 100 / 12).toFixed(2)}`
              : "$49"}
          </div>
          <div style={styles.priceSub}>
            {interval === "yearly" ? "per month, billed $399/yr" : "per month"}
          </div>
          {interval === "yearly" && (
            <div style={styles.savings}>
              You save ${yearlySavings("AGENCY") / 100}/yr
            </div>
          )}
          <p style={styles.tagline}>For teams, agencies, and power users.</p>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={() => handleUpgrade("AGENCY")}
            disabled={loading === "AGENCY"}
            type="button"
          >
            {loading === "AGENCY" ? "Loading..." : "Start 7-day free trial"}
          </button>
          <div style={styles.limitNote}>Unlimited analyses · API access</div>
          <div style={styles.featureList}>
            <div style={styles.featRow}>{checkIcon}<span>Everything in Pro</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Unlimited analyses</span></div>
            <div style={styles.featRow}>{checkIcon}<span>REST API access</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Forever analysis history</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Priority support</span></div>
            <div style={styles.featRow}>{checkIcon}<span>Usage analytics dashboard</span></div>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div style={styles.tableWrap}>
        <h2 style={styles.tableTitle}>Full feature comparison</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: "left" }}>Feature</th>
              <th style={styles.th}>Free</th>
              <th style={{ ...styles.th, color: "#FF2D55" }}>Pro</th>
              <th style={styles.th}>Agency</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={i} style={i % 2 === 0 ? styles.rowEven : {}}>
                <td style={styles.tdLabel}>{f.label}</td>
                <td style={styles.td}>{renderCell(f.free)}</td>
                <td style={styles.td}>{renderCell(f.pro)}</td>
                <td style={styles.td}>{renderCell(f.agency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div style={styles.faq}>
        <h2 style={styles.faqTitle}>Common questions</h2>
        <div style={styles.faqGrid}>
          {[
            {
              q: "Do I need a credit card for the free trial?",
              a: "No. Start the free plan with no card at all. The Pro and Agency 7-day trials do require a card but you won't be charged until the trial ends.",
            },
            {
              q: "How does the monthly analysis limit work?",
              a: "Limits reset on the 1st of each month. Unused analyses don't roll over. Agency plan has no limit.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from your dashboard billing page at any time. You keep access until the end of your billing period.",
            },
            {
              q: "What video formats are supported?",
              a: "MP4, MOV, AVI, WEBM, and MKV up to 500MB. Your video never leaves your device — we only send extracted metadata and frames to the AI.",
            },
            {
              q: "What's the API access on Agency?",
              a: "A REST API that lets you submit video signals and receive analysis JSON programmatically — perfect for building internal tools or automating analysis for multiple clients.",
            },
            {
              q: "Do you offer refunds?",
              a: "Yes. If you're not satisfied within the first 14 days of a paid plan, email us for a full refund, no questions asked.",
            },
          ].map((item, i) => (
            <div key={i} style={styles.faqItem}>
              <div style={styles.faqQ}>{item.q}</div>
              <div style={styles.faqA}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function renderCell(val: boolean | string) {
  if (val === true) return <span style={{ color: "#FF2D55" }}>✓</span>;
  if (val === false) return <span style={{ color: "#7E8793" }}>—</span>;
  return <span style={{ fontSize: 13 }}>{val}</span>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" },
  header: { textAlign: "center", marginBottom: 56 },
  eyebrow: { fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "#FF2D55", fontWeight: 600, marginBottom: 16 },
  h1: { fontSize: "clamp(36px,6vw,60px)", fontWeight: 800, letterSpacing: -2, marginBottom: 16, lineHeight: 1.05 },
  sub: { fontSize: 18, color: "#B8C0CA", maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.6 },
  toggleWrap: { display: "inline-flex", background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 100, padding: 4, gap: 4 },
  toggleBtn: { background: "none", border: "none", borderRadius: 100, padding: "10px 22px", fontSize: 14, color: "#B8C0CA", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
  toggleActive: { background: "#252525", color: "#F5F0E8" },
  saveBadge: { background: "rgba(255,45,85,.15)", color: "#FF2D55", fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 600 },
  cardsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 64, alignItems: "start" },
  card: { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 20, padding: "28px 24px", position: "relative" as const },
  cardFeatured: { border: "1.5px solid #FF2D55", background: "#130810" },
  badge: { position: "absolute" as const, top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white", fontSize: 12, fontWeight: 700, padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap" as const },
  planName: { fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "#B8C0CA", marginBottom: 12 },
  price: { fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1 },
  priceSub: { fontSize: 13, color: "#B8C0CA", marginTop: 4, marginBottom: 4 },
  savings: { fontSize: 12, color: "#FF6B35", fontWeight: 600, marginBottom: 4 },
  tagline: { fontSize: 14, color: "#B8C0CA", lineHeight: 1.5, marginBottom: 20, marginTop: 8 },
  btn: { display: "block", width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none", textAlign: "center" as const, textDecoration: "none", marginBottom: 12, fontFamily: "inherit" },
  btnPrimary: { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white" },
  btnSecondary: { background: "#252525", border: "0.5px solid #333", color: "#F5F0E8" },
  limitNote: { fontSize: 12, color: "#AEB6C1", textAlign: "center" as const, marginBottom: 24 },
  featureList: { display: "flex", flexDirection: "column" as const, gap: 10 },
  featRow: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#ccc", lineHeight: 1.4 },
  xMuted: { color: "#7E8793" },
  muted: { color: "#AEB6C1" },
  tableWrap: { marginBottom: 64 },
  tableTitle: { fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: -0.5 },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { padding: "12px 16px", fontSize: 13, fontWeight: 600, textAlign: "center" as const, color: "#B8C0CA", borderBottom: "0.5px solid #2A2A2A" },
  td: { padding: "12px 16px", textAlign: "center" as const, borderBottom: "0.5px solid #1A1A1A", fontSize: 14, color: "#ccc" },
  tdLabel: { padding: "12px 16px", fontSize: 14, color: "#C7CDD6", borderBottom: "0.5px solid #1A1A1A" },
  rowEven: { background: "#0D0D0D" },
  faq: { maxWidth: 800, margin: "0 auto" },
  faqTitle: { fontSize: 22, fontWeight: 700, marginBottom: 32, letterSpacing: -0.5 },
  faqGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  faqItem: { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, padding: "20px" },
  faqQ: { fontSize: 15, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 },
  faqA: { fontSize: 14, color: "#B8C0CA", lineHeight: 1.6 },
};
