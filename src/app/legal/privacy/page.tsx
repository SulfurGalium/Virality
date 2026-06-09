// src/app/legal/privacy/page.tsx

export const metadata = {
  title: "Privacy Policy - hypr marketing",
  description: "hypr marketing Privacy Policy - GDPR, CCPA, and COPPA compliant",
};

export default function PrivacyPage() {
  const updated = "January 1, 2025";
  const email = "privacy@hyprmarketing.app";
  const dpoEmail = "dpo@hyprmarketing.app";

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.meta}>Last updated: {updated}</p>

        <div style={s.intro}>
          This Privacy Policy explains how hypr marketing ("we," "us," "our") collects, uses,
          discloses, and protects information about you when you use our website and services.
          We are committed to protecting your privacy and complying with applicable data
          protection laws including the GDPR (EU/UK), CCPA (California), and COPPA (US).
        </div>

        <Section title="1. Who We Are">
          <p>hypr marketing operates the hyprmarketing.app website and related services. For the purposes
          of the GDPR, we act as a data controller for personal information we collect directly
          from you. For AI processing conducted through Anthropic's API, we act as a data
          processor passing limited metadata; Anthropic acts as a sub-processor.</p>
          <p><strong>Data Protection Contact:</strong>{" "}
          <a href={`mailto:${dpoEmail}`} style={s.link}>{dpoEmail}</a></p>
        </Section>

        <Section title="2. Information We Collect">
          <h3 style={s.h3}>2.1 Information you provide directly</h3>
          <ul>
            <li><strong>Account information:</strong> email address, name, and profile photo
                when you register (via Clerk authentication)</li>
            <li><strong>Payment information:</strong> billing address and card details — these
                are collected and stored directly by Stripe; we never see or store your full
                card number</li>
            <li><strong>Support communications:</strong> messages you send to our support team</li>
            <li><strong>Optional context:</strong> content niche and target audience description
                you provide to improve analysis results</li>
          </ul>

          <h3 style={s.h3}>2.2 Information collected automatically</h3>
          <ul>
            <li><strong>Video metadata:</strong> filename, MIME type, and file size of videos
                you submit for analysis. <strong>Your actual video content is never uploaded
                to our servers.</strong> Processing occurs in your browser.</li>
            <li><strong>Analysis outputs:</strong> content scores, captions, hashtags, and
                recommendations generated for your submissions, stored in your account history</li>
            <li><strong>Usage data:</strong> number of analyses performed, timestamps, and
                feature usage patterns</li>
            <li><strong>Technical data:</strong> IP address (for rate limiting and fraud
                prevention), browser type and version, operating system, referring URLs, and
                page view data</li>
            <li><strong>Cookies:</strong> see Section 7 (Cookie Policy) below</li>
          </ul>

          <h3 style={s.h3}>2.3 Information we do NOT collect</h3>
          <ul>
            <li>Your actual video file content — never transmitted to our servers</li>
            <li>Social media account credentials or follower data</li>
            <li>Biometric data</li>
            <li>Sensitive personal categories (health, race, religion, etc.)</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use your information for the following purposes, with the corresponding
          legal basis under GDPR:</p>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Purpose</th>
                <th style={s.th}>Legal Basis (GDPR)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Providing the analysis service", "Contract performance"],
                ["Processing payments and managing subscriptions", "Contract performance"],
                ["Account authentication and security", "Contract performance / Legitimate interest"],
                ["Rate limiting and abuse prevention", "Legitimate interest"],
                ["Improving our AI models and service quality", "Legitimate interest"],
                ["Sending transactional emails (receipts, alerts)", "Contract performance"],
                ["Sending marketing emails (with your consent)", "Consent"],
                ["Complying with legal obligations", "Legal obligation"],
                ["Enforcing our Terms of Service", "Legitimate interest"],
              ].map(([purpose, basis], i) => (
                <tr key={i} style={i % 2 === 0 ? s.rowEven : {}}>
                  <td style={s.td}>{purpose}</td>
                  <td style={{ ...s.td, color: "#B8C0CA", fontSize: 13 }}>{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="4. How We Share Your Information">
          <p>We do not sell, rent, or trade your personal information. We share information
          only as follows:</p>

          <h3 style={s.h3}>4.1 Service providers (sub-processors)</h3>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Provider</th>
                <th style={s.th}>Purpose</th>
                <th style={s.th}>Location</th>
                <th style={s.th}>Safeguard</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Anthropic", "AI analysis (receives filename, type, size, frames)", "USA", "DPA / SCCs"],
                ["OpenAI", "Speech transcription via Whisper API", "USA", "DPA / SCCs"],
                ["Clerk", "Authentication and user management", "USA", "DPA / SCCs"],
                ["Stripe", "Payment processing and billing", "USA", "DPA / SCCs"],
                ["Supabase", "Database hosting (PostgreSQL)", "USA", "DPA / SCCs"],
                ["Upstash", "Rate limiting (Redis)", "USA", "DPA / SCCs"],
                ["Vercel", "Hosting and edge functions", "USA/EU", "DPA / SCCs"],
              ].map(([provider, purpose, location, safeguard], i) => (
                <tr key={i} style={i % 2 === 0 ? s.rowEven : {}}>
                  <td style={{ ...s.td, fontWeight: 500 }}>{provider}</td>
                  <td style={s.td}>{purpose}</td>
                  <td style={{ ...s.td, color: "#B8C0CA", fontSize: 13 }}>{location}</td>
                  <td style={{ ...s.td, color: "#B8C0CA", fontSize: 13 }}>{safeguard}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={s.h3}>4.2 Legal disclosures</h3>
          <p>We may disclose your information if required by law, court order, or government
          request, or to protect the rights, property, or safety of hypr marketing, our users,
          or the public.</p>

          <h3 style={s.h3}>4.3 Business transfers</h3>
        <p>If hypr marketing is acquired, merged, or undergoes a restructuring, your information
          may be transferred as part of that transaction. We will notify you before your
          information becomes subject to a different privacy policy.</p>
        </Section>

        <Section title="5. Data Retention">
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Data Type</th>
                <th style={s.th}>Retention Period</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Account information", "Until account deletion + 30 days"],
                ["Analysis history (Free plan)", "7 days after analysis"],
                ["Analysis history (Pro plan)", "1 year after analysis"],
                ["Analysis history (Agency plan)", "Until account deletion"],
                ["Payment records / invoices", "7 years (tax/legal obligation)"],
                ["IP address logs (rate limiting)", "30 days"],
                ["Security logs", "90 days"],
                ["Support communications", "3 years"],
              ].map(([type, period], i) => (
                <tr key={i} style={i % 2 === 0 ? s.rowEven : {}}>
                  <td style={s.td}>{type}</td>
                  <td style={{ ...s.td, color: "#B8C0CA", fontSize: 13 }}>{period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="6. Your Rights">
          <h3 style={s.h3}>Rights available to all users</h3>
          <ul>
            <li><strong>Access:</strong> Request a copy of personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data
                (subject to legal retention requirements)</li>
            <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
            <li><strong>Opt-out of marketing:</strong> Unsubscribe from marketing emails at
                any time via the unsubscribe link or by emailing {email}</li>
          </ul>

          <h3 style={s.h3}>Additional rights for EU/UK residents (GDPR/UK GDPR)</h3>
          <ul>
            <li><strong>Object:</strong> Object to processing based on legitimate interest</li>
            <li><strong>Restrict:</strong> Request restriction of processing in certain
                circumstances</li>
            <li><strong>Withdraw consent:</strong> Where processing is based on consent,
                withdraw it at any time without affecting prior processing</li>
            <li><strong>Lodge a complaint:</strong> You have the right to lodge a complaint
                with your local data protection authority (e.g., ICO in the UK, your national
                DPA in the EU)</li>
          </ul>

          <h3 style={s.h3}>Additional rights for California residents (CCPA/CPRA)</h3>
          <ul>
            <li><strong>Know:</strong> Right to know what personal information we collect,
                use, disclose, and sell (we do not sell personal information)</li>
            <li><strong>Delete:</strong> Right to request deletion of personal information</li>
            <li><strong>Correct:</strong> Right to correct inaccurate personal information</li>
            <li><strong>Opt-out of sale/sharing:</strong> We do not sell or share personal
                information for cross-context behavioral advertising</li>
            <li><strong>Non-discrimination:</strong> We will not discriminate against you for
                exercising your CCPA rights</li>
          </ul>

          <p>To exercise any of these rights, email us at{" "}
          <a href={`mailto:${email}`} style={s.link}>{email}</a> with subject line
          "Privacy Rights Request." We will respond within 30 days (GDPR) or 45 days (CCPA).
          We may need to verify your identity before processing requests.</p>
        </Section>

        <Section title="7. Cookie Policy">
          <p>We use the following categories of cookies:</p>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Category</th>
                <th style={s.th}>Purpose</th>
                <th style={s.th}>Duration</th>
                <th style={s.th}>Can opt out?</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Strictly necessary", "Authentication session, CSRF protection", "Session", "No (required for service)"],
                ["Functional", "User preferences (e.g., billing interval)", "1 year", "Yes"],
                ["Analytics", "Aggregate usage statistics (no personal tracking)", "90 days", "Yes"],
              ].map(([cat, purpose, duration, optout], i) => (
                <tr key={i} style={i % 2 === 0 ? s.rowEven : {}}>
                  <td style={{ ...s.td, fontWeight: 500 }}>{cat}</td>
                  <td style={s.td}>{purpose}</td>
                  <td style={{ ...s.td, fontSize: 13, color: "#B8C0CA" }}>{duration}</td>
                  <td style={{ ...s.td, fontSize: 13, color: "#B8C0CA" }}>{optout}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>We do not use advertising cookies, third-party tracking cookies, or fingerprinting
          technologies. You can manage cookie preferences in your browser settings.</p>
        </Section>

        <Section title="8. Data Security">
          <p>We implement appropriate technical and organizational measures to protect your
          information, including:</p>
          <ul>
            <li>TLS 1.3 encryption for all data in transit</li>
            <li>AES-256 encryption for data at rest in our database</li>
            <li>API keys stored as environment variables, never in source code</li>
            <li>Rate limiting and abuse prevention on all endpoints</li>
            <li>Regular security reviews and dependency updates</li>
            <li>Access controls limiting employee access to personal data</li>
          </ul>
          <p>No system is perfectly secure. In the event of a data breach affecting your
          rights and freedoms, we will notify affected users and relevant authorities as
          required by law (within 72 hours under GDPR).</p>
        </Section>

        <Section title="9. Children's Privacy (COPPA)">
          <p>Our service is not directed to children under the age of 13. We do not knowingly
          collect personal information from children under 13. If you believe a child under 13
          has provided us with personal information, contact us immediately at {email} and we
          will delete it promptly.</p>
          <p>Users between 13 and 18 may use the service only with parental consent. Parents
          may request access to, correction of, or deletion of their minor child's information
          by contacting us at {email}.</p>
        </Section>

        <Section title="10. International Data Transfers">
          <p>We are based in the United States. If you are located outside the US, your
          information will be transferred to and processed in the US. For transfers from the
          EU/UK, we rely on Standard Contractual Clauses (SCCs) approved by the European
          Commission as our transfer mechanism with our sub-processors. A list of our
          sub-processors is provided in Section 4.1.</p>
        </Section>

        <Section title="11. AI and Automated Decision-Making">
          <p>Our service uses AI to generate content scores and recommendations. These outputs
          are informational tools — they do not constitute automated decisions that produce
          legal or similarly significant effects on you. No decisions about you are made solely
          by automated means without human review.</p>
          <p>Under GDPR Article 22, you have the right not to be subject to automated decisions
          that significantly affect you. As our analysis is advisory only, this provision does
          not apply to our normal service. If you have concerns, contact {dpoEmail}.</p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>We will notify you of material changes by: (a) sending an email to your registered
          address, and (b) posting a notice on our website, at least 14 days before changes
          take effect. Your continued use of the service after changes take effect constitutes
          acceptance of the updated policy.</p>
        </Section>

        <div style={s.contact}>
          <strong>Privacy questions or requests?</strong><br />
          Email: <a href={`mailto:${email}`} style={s.link}>{email}</a><br />
          DPO: <a href={`mailto:${dpoEmail}`} style={s.link}>{dpoEmail}</a>
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
  wrap: { maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "'DM Sans', sans-serif" },
  h1: { fontSize: "clamp(28px,5vw,44px)", fontWeight: 800, letterSpacing: -1.5, marginBottom: 8 },
  meta: { fontSize: 14, color: "#AEB6C1", marginBottom: 32 },
  intro: { background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, padding: "20px 22px", fontSize: 15, lineHeight: 1.7, color: "#aaa", marginBottom: 40 },
  section: { marginBottom: 40 },
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: "0.5px solid #2A2A2A", letterSpacing: -0.3 },
  h3: { fontSize: 15, fontWeight: 600, marginTop: 16, marginBottom: 8 },
  link: { color: "#FF2D55", textDecoration: "none" },
  contact: { marginTop: 48, padding: "20px 22px", background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, fontSize: 14, lineHeight: 2.2, color: "#aaa" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 14 },
  th: { textAlign: "left", padding: "10px 14px", background: "#141414", borderBottom: "0.5px solid #2A2A2A", fontWeight: 600, fontSize: 13, color: "#B8C0CA" },
  td: { padding: "10px 14px", borderBottom: "0.5px solid #1A1A1A", verticalAlign: "top", lineHeight: 1.5, color: "#ccc" },
  rowEven: { background: "#0D0D0D" },
};
