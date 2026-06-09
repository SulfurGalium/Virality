// src/app/legal/security/page.tsx

export const metadata = {
  title: "Security Policy - hypr marketing",
};

export default function SecurityPage() {
  const updated = "January 1, 2025";

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>Security Policy</h1>
        <p style={s.meta}>Last updated: {updated}</p>

        <div style={s.intro}>
          We take the security of hypr marketing seriously. If you discover a security vulnerability,
          we encourage responsible disclosure and will work with you to resolve it quickly.
        </div>

        <Section title="Reporting a Vulnerability">
          <p>Please report security vulnerabilities to:{" "}
          <a href="mailto:security@hyprmarketing.app" style={s.link}>security@hyprmarketing.app</a></p>
          <p>Include in your report:</p>
          <ul>
            <li>A description of the vulnerability and its potential impact</li>
            <li>Steps to reproduce the issue (proof of concept if possible)</li>
            <li>Your name and contact information (optional — anonymous reports accepted)</li>
          </ul>
          <p>We will acknowledge your report within 48 hours and provide a timeline for resolution.
          We ask that you do not publicly disclose the vulnerability until we have had a
          reasonable opportunity to address it (typically 90 days).</p>
        </Section>

        <Section title="Scope">
          <p><strong>In scope:</strong></p>
          <ul>
            <li>hyprmarketing.app and all subdomains</li>
            <li>Our API endpoints</li>
            <li>Authentication flows</li>
            <li>Payment handling</li>
            <li>Data exposure vulnerabilities</li>
          </ul>
          <p><strong>Out of scope:</strong></p>
          <ul>
            <li>Social engineering attacks against our team</li>
            <li>Physical attacks against our infrastructure</li>
            <li>Denial of service attacks</li>
            <li>Vulnerabilities in third-party services (report those to the respective vendors)</li>
            <li>Issues requiring unlikely user interaction</li>
          </ul>
        </Section>

        <Section title="What We Promise">
          <ul>
            <li>We will not pursue legal action against researchers who follow this policy</li>
            <li>We will acknowledge your report promptly</li>
            <li>We will keep you informed of our progress</li>
            <li>We will credit you in our security acknowledgments (if you wish)</li>
            <li>We will not share your personal information without consent</li>
          </ul>
        </Section>

        <Section title="Our Security Practices">
          <ul>
            <li>All data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
            <li>API keys stored in environment variables, never in source code or client bundles</li>
            <li>Webhook signatures verified cryptographically (Stripe, Clerk)</li>
            <li>Rate limiting on all endpoints via Upstash Redis</li>
            <li>Input validation and sanitization on all API inputs</li>
            <li>Content Security Policy headers on all responses</li>
            <li>Strict CORS enforcement (same-origin only)</li>
            <li>Magic byte validation on uploaded audio</li>
            <li>Atomic database transactions for usage counters (race condition prevention)</li>
            <li>No video content ever leaves the user's browser</li>
            <li>Dependencies kept up to date with automated alerts</li>
          </ul>
        </Section>

        <div style={s.contact}>
          <strong>Security contact:</strong>{" "}
          <a href="mailto:security@hyprmarketing.app" style={s.link}>security@hyprmarketing.app</a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={s.section}>
      <h2 style={s.h2}>{title}</h2>
      {children}
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "#0A0A0A", minHeight: "100vh", color: "#F5F0E8" },
  wrap: { maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "'DM Sans', sans-serif" },
  h1: { fontSize: "clamp(28px,5vw,44px)", fontWeight: 800, letterSpacing: -1.5, marginBottom: 8 },
  meta: { fontSize: 14, color: "#AEB6C1", marginBottom: 32 },
  intro: { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, padding: "20px 22px", fontSize: 15, lineHeight: 1.7, color: "#aaa", marginBottom: 40 },
  section: { marginBottom: 40 },
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: "0.5px solid #2A2A2A" },
  link: { color: "#FF2D55", textDecoration: "none" },
  contact: { marginTop: 48, padding: "20px 22px", background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, fontSize: 14, lineHeight: 2.4, color: "#aaa" },
};
