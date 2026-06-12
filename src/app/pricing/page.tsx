"use client";
// src/app/pricing/page.tsx

import { useState } from "react";
import { PLANS, yearlySavings } from "@/lib/plans";
import Link from "next/link";

const checkIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="8" fill="currentColor" opacity=".15"/>
    <path d="M4.5 8l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const xIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const features = [
  { label: "Analyses per month",              free: "4",         pro: "100",    agency: "Unlimited" },
  { label: "Frame-by-frame visual AI",        free: false,       pro: true,     agency: true },
  { label: "Speech transcription (Whisper)",  free: false,       pro: true,     agency: true },
  { label: "Real-time trending hashtags",     free: false,       pro: true,     agency: true },
  { label: "PDF report export",               free: false,       pro: true,     agency: true },
  { label: "Analysis history",                free: "7 days",    pro: "1 year", agency: "Forever" },
  { label: "Shareable report links",          free: false,       pro: true,     agency: true },
  { label: "API access",                      free: false,       pro: false,    agency: true },
  { label: "Support",                         free: "Community", pro: "Email",  agency: "Priority" },
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
    <main style={s.page} id="main-content">
      {/* Nav */}
      <nav style={s.nav} aria-label="Site navigation">
        <Link href="/" style={s.navBrand} aria-label="Hypr Marketing home">
          <span aria-hidden="true" style={s.brandMark}>h</span>
          Hypr Marketing
        </Link>
        <div style={s.navLinks}>
          <Link href="/dashboard" style={s.navLink}>Dashboard</Link>
          <Link href="/legal/terms" style={s.navLink}>Terms</Link>
          <Link href="/legal/privacy" style={s.navLink}>Privacy</Link>
        </div>
      </nav>

      {/* Header */}
      <header style={s.header}>
        <p style={s.eyebrow}>Simple pricing</p>
        <h1 style={s.h1}>Pay for what you actually use</h1>
        <p style={s.sub}>
          Start free — no credit card required. Upgrade when you need more power.
        </p>

        {/* Interval toggle */}
        <div style={s.toggleWrap} role="group" aria-label="Billing interval">
          <button
            style={{ ...s.toggleBtn, ...(interval === "monthly" ? s.toggleActive : {}) }}
            onClick={() => setInterval("monthly")}
            type="button"
            aria-pressed={interval === "monthly"}
          >
            Monthly
          </button>
          <button
            style={{ ...s.toggleBtn, ...(interval === "yearly" ? s.toggleActive : {}) }}
            onClick={() => setInterval("yearly")}
            type="button"
            aria-pressed={interval === "yearly"}
          >
            Yearly
            <span style={s.saveBadge} aria-label="Save up to $189 per year">Save up to $189</span>
          </button>
        </div>
      </header>

      {/* Cards */}
      <div style={s.cardsRow}>

        {/* Free */}
        <article style={s.card} aria-label="Free plan">
          <p style={s.planName}>Free</p>
          <p style={s.price} aria-label="Price: free">$0</p>
          <p style={s.priceSub}>forever</p>
          <p style={s.tagline}>Get a feel for what&apos;s possible.</p>
          <Link href="/sign-up" style={{ ...s.btn, ...s.btnSecondary }}>
            Get started free
          </Link>
          <p style={s.limitNote}>4 analyses / month</p>
          <ul style={s.featureList} aria-label="Free plan features">
            <li style={s.featRow}>{checkIcon}<span>Filename-based AI analysis</span></li>
            <li style={s.featRow}>{checkIcon}<span>Content score &amp; verdict</span></li>
            <li style={s.featRow}>{checkIcon}<span>Caption &amp; hashtag suggestions</span></li>
            <li style={{ ...s.featRow, color: "#7E8793" }}>{xIcon}<span>Frame extraction</span></li>
            <li style={{ ...s.featRow, color: "#7E8793" }}>{xIcon}<span>Transcription</span></li>
            <li style={{ ...s.featRow, color: "#7E8793" }}>{xIcon}<span>PDF export</span></li>
          </ul>
        </article>

        {/* Pro */}
        <article style={{ ...s.card, ...s.cardFeatured }} aria-label="Pro plan, most popular">
          <div style={s.badge} aria-label="Most popular plan">Most popular</div>
          <p style={s.planName}>Pro</p>
          <p style={s.price} aria-label={`Price: ${interval === "yearly" ? "$6.58 per month billed yearly" : "$9 per month"}`}>
            {interval === "yearly" ? `$${(7900 / 100 / 12).toFixed(2)}` : "$9"}
          </p>
          <p style={s.priceSub}>
            {interval === "yearly" ? "per month, billed $79/yr" : "per month"}
          </p>
          {interval === "yearly" && (
            <p style={s.savings}>You save ${yearlySavings("PRO") / 100}/yr</p>
          )}
          <p style={s.tagline}>For serious creators who want real results.</p>
          <button
            style={{ ...s.btn, ...s.btnPrimary }}
            onClick={() => handleUpgrade("PRO")}
            disabled={loading === "PRO"}
            type="button"
            aria-busy={loading === "PRO"}
          >
            {loading === "PRO" ? "Loading…" : "Get Pro"}
          </button>
          <p style={s.limitNote}>100 analyses / month</p>
          <ul style={s.featureList} aria-label="Pro plan features">
            <li style={s.featRow}>{checkIcon}<span>Everything in Free</span></li>
            <li style={s.featRow}>{checkIcon}<span>Frame-by-frame visual analysis</span></li>
            <li style={s.featRow}>{checkIcon}<span>Speech transcription (Whisper)</span></li>
            <li style={s.featRow}>{checkIcon}<span>Real-time trending hashtags</span></li>
            <li style={s.featRow}>{checkIcon}<span>PDF report export</span></li>
            <li style={s.featRow}>{checkIcon}<span>1-year analysis history</span></li>
            <li style={s.featRow}>{checkIcon}<span>Shareable report links</span></li>
            <li style={s.featRow}>{checkIcon}<span>Email support</span></li>
          </ul>
        </article>

        {/* Agency */}
        <article style={s.card} aria-label="Agency plan">
          <p style={s.planName}>Agency</p>
          <p style={s.price} aria-label={`Price: ${interval === "yearly" ? "$33.25 per month billed yearly" : "$49 per month"}`}>
            {interval === "yearly" ? `$${(39900 / 100 / 12).toFixed(2)}` : "$49"}
          </p>
          <p style={s.priceSub}>
            {interval === "yearly" ? "per month, billed $399/yr" : "per month"}
          </p>
          {interval === "yearly" && (
            <p style={s.savings}>You save ${yearlySavings("AGENCY") / 100}/yr</p>
          )}
          <p style={s.tagline}>For teams, agencies, and power users.</p>
          <button
            style={{ ...s.btn, ...s.btnSecondary }}
            onClick={() => handleUpgrade("AGENCY")}
            disabled={loading === "AGENCY"}
            type="button"
            aria-busy={loading === "AGENCY"}
          >
            {loading === "AGENCY" ? "Loading…" : "Get Agency"}
          </button>
          <p style={s.limitNote}>Unlimited analyses · API access</p>
          <ul style={s.featureList} aria-label="Agency plan features">
            <li style={s.featRow}>{checkIcon}<span>Everything in Pro</span></li>
            <li style={s.featRow}>{checkIcon}<span>Unlimited analyses</span></li>
            <li style={s.featRow}>{checkIcon}<span>REST API access</span></li>
            <li style={s.featRow}>{checkIcon}<span>Forever analysis history</span></li>
            <li style={s.featRow}>{checkIcon}<span>Priority support</span></li>
            <li style={s.featRow}>{checkIcon}<span>Usage analytics dashboard</span></li>
          </ul>
        </article>
      </div>

      {/* Comparison table */}
      <section style={s.tableWrap} aria-labelledby="comparison-heading">
        <h2 id="comparison-heading" style={s.sectionTitle}>Full feature comparison</h2>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, textAlign: "left" }} scope="col">Feature</th>
              <th style={s.th} scope="col">Free</th>
              <th style={{ ...s.th, color: "#FF2D55" }} scope="col">Pro</th>
              <th style={s.th} scope="col">Agency</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={i} style={i % 2 === 0 ? s.rowEven : {}}>
                <td style={s.tdLabel}>{f.label}</td>
                <td style={s.td}>{renderCell(f.free)}</td>
                <td style={s.td}>{renderCell(f.pro)}</td>
                <td style={s.td}>{renderCell(f.agency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Legal links — ADA & ToS clearly displayed */}
      <section style={s.legalBand} aria-label="Legal information">
        <div style={s.legalLinks}>
          <Link href="/legal/terms" style={s.legalLink}>Terms of Service</Link>
          <span style={s.legalDot} aria-hidden="true">·</span>
          <Link href="/legal/privacy" style={s.legalLink}>Privacy Policy</Link>
          <span style={s.legalDot} aria-hidden="true">·</span>
          <Link href="/legal/acceptable-use" style={s.legalLink}>Acceptable Use</Link>
          <span style={s.legalDot} aria-hidden="true">·</span>
          <Link href="/legal/security" style={s.legalLink}>Security</Link>
        </div>
        <p style={s.legalNote}>
          By upgrading you agree to our{" "}
          <Link href="/legal/terms" style={s.legalInline}>Terms of Service</Link>
          {" "}and{" "}
          <Link href="/legal/privacy" style={s.legalInline}>Privacy Policy</Link>.
          {" "}Hypr Marketing is committed to accessibility — this product targets WCAG 2.1 Level AA.
          {" "}Contact us at{" "}
          <a href="mailto:accessibility@hyprmarketing.app" style={s.legalInline}>
            accessibility@hyprmarketing.app
          </a>{" "}
          to report any barriers.
        </p>
      </section>

      {/* FAQ */}
      <section style={s.faq} aria-labelledby="faq-heading">
        <h2 id="faq-heading" style={s.sectionTitle}>Common questions</h2>
        <dl style={s.faqGrid}>
          {[
            {
              q: "Do I need a credit card for the free plan?",
              a: "No. The free plan requires no payment details at all.",
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
              a: "MP4, MOV, AVI, WEBM, and MKV up to 500 MB. Your video never leaves your device — we only send extracted metadata and frames to the AI.",
            },
            {
              q: "What is the Agency API?",
              a: "A REST API that lets you submit video signals and receive analysis JSON programmatically — ideal for internal tools or automating analysis across multiple clients.",
            },
            {
              q: "Do you offer refunds?",
              a: "Yes. If you are not satisfied within the first 14 days of a paid plan, email us for a full refund.",
            },
          ].map((item, i) => (
            <div key={i} style={s.faqItem}>
              <dt style={s.faqQ}>{item.q}</dt>
              <dd style={s.faqA}>{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

function renderCell(val: boolean | string) {
  if (val === true)  return <span style={{ color: "#FF2D55" }} aria-label="Included">✓</span>;
  if (val === false) return <span style={{ color: "#7E8793" }} aria-label="Not included">—</span>;
  return <span style={{ fontSize: 13 }}>{val}</span>;
}

const s: Record<string, React.CSSProperties> = {
  page:         { maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" },
  nav:          { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 40px" },
  navBrand:     { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#F5F0E8", fontWeight: 600, fontSize: 16 },
  brandMark:    { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 },
  navLinks:     { display: "flex", gap: 24, alignItems: "center" },
  navLink:      { color: "#B8C0CA", textDecoration: "none", fontSize: 14, fontWeight: 500 },
  header:       { textAlign: "center", marginBottom: 56 },
  eyebrow:      { fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#FF2D55", fontWeight: 600, marginBottom: 16 },
  h1:           { fontSize: "clamp(32px,5vw,52px)", fontWeight: 700, letterSpacing: -1, marginBottom: 16, lineHeight: 1.1 },
  sub:          { fontSize: 17, color: "#B8C0CA", maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.7 },
  toggleWrap:   { display: "inline-flex", background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 100, padding: 4, gap: 4 },
  toggleBtn:    { background: "none", border: "none", borderRadius: 100, padding: "10px 22px", fontSize: 14, color: "#B8C0CA", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
  toggleActive: { background: "#252525", color: "#F5F0E8" },
  saveBadge:    { background: "rgba(255,45,85,.15)", color: "#FF2D55", fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 600 },
  cardsRow:     { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginBottom: 64, alignItems: "start" },
  card:         { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 20, padding: "28px 24px", position: "relative" as const },
  cardFeatured: { border: "1.5px solid #FF2D55", background: "#130810" },
  badge:        { position: "absolute" as const, top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white", fontSize: 12, fontWeight: 700, padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap" as const },
  planName:     { fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "#B8C0CA", marginBottom: 12 },
  price:        { fontSize: 46, fontWeight: 700, letterSpacing: -1, lineHeight: 1 },
  priceSub:     { fontSize: 13, color: "#B8C0CA", marginTop: 4, marginBottom: 4 },
  savings:      { fontSize: 12, color: "#FF6B35", fontWeight: 600, marginBottom: 4 },
  tagline:      { fontSize: 14, color: "#B8C0CA", lineHeight: 1.6, marginBottom: 20, marginTop: 8 },
  btn:          { display: "block", width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", border: "none", textAlign: "center" as const, textDecoration: "none", marginBottom: 12, fontFamily: "inherit", letterSpacing: 0 },
  btnPrimary:   { background: "linear-gradient(135deg,#FF2D55,#FF6B35)", color: "white" },
  btnSecondary: { background: "#252525", border: "0.5px solid #333", color: "#F5F0E8" },
  limitNote:    { fontSize: 12, color: "#AEB6C1", textAlign: "center" as const, marginBottom: 24 },
  featureList:  { display: "flex", flexDirection: "column" as const, gap: 10, listStyle: "none", padding: 0, margin: 0 },
  featRow:      { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#ccc", lineHeight: 1.4 },
  tableWrap:    { marginBottom: 64 },
  sectionTitle: { fontSize: 21, fontWeight: 600, marginBottom: 24, letterSpacing: -0.3 },
  table:        { width: "100%", borderCollapse: "collapse" as const },
  th:           { padding: "12px 16px", fontSize: 13, fontWeight: 600, textAlign: "center" as const, color: "#B8C0CA", borderBottom: "0.5px solid #2A2A2A" },
  td:           { padding: "12px 16px", textAlign: "center" as const, borderBottom: "0.5px solid #1A1A1A", fontSize: 14, color: "#ccc" },
  tdLabel:      { padding: "12px 16px", fontSize: 14, color: "#C7CDD6", borderBottom: "0.5px solid #1A1A1A" },
  rowEven:      { background: "#0D0D0D" },
  legalBand:    { background: "#0D0D0D", border: "0.5px solid #1E1E1E", borderRadius: 14, padding: "24px 28px", marginBottom: 48, textAlign: "center" as const },
  legalLinks:   { display: "flex", justifyContent: "center", flexWrap: "wrap" as const, gap: 8, marginBottom: 12 },
  legalLink:    { color: "#B8C0CA", textDecoration: "none", fontSize: 13, fontWeight: 500, padding: "4px 8px", borderRadius: 6, border: "0.5px solid #2A2A2A" },
  legalDot:     { color: "#3A3A3A", fontSize: 13, lineHeight: "28px" },
  legalNote:    { fontSize: 12, color: "#666", lineHeight: 1.7, maxWidth: 680, margin: "0 auto" },
  legalInline:  { color: "#B8C0CA", textDecoration: "underline" },
  faq:          { maxWidth: 800, margin: "0 auto" },
  faqGrid:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  faqItem:      { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, padding: "20px" },
  faqQ:         { fontSize: 15, fontWeight: 600, marginBottom: 8, lineHeight: 1.4, display: "block" },
  faqA:         { fontSize: 14, color: "#B8C0CA", lineHeight: 1.6, margin: 0 },
};
