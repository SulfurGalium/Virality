// src/app/legal/terms/page.tsx

export const metadata = {
  title: "Terms of Service - hypr marketing",
  description: "hypr marketing Terms of Service",
};

export default function TermsPage() {
  const updated = "January 1, 2025";
  const effective = "January 1, 2025";
  const company = "hypr marketing";
  const email = "legal@hyprmarketing.app";

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>Terms of Service</h1>
        <p style={s.meta}>Last updated: {updated} · Effective: {effective}</p>

        <div style={s.intro}>
          Please read these Terms of Service ("Terms") carefully before using the hypr marketing
          website and services. By accessing or using {company}, you agree to be bound by
          these Terms. If you do not agree, do not use the service.
        </div>

        <Section title="1. Acceptance of Terms">
          <p>These Terms constitute a legally binding agreement between you ("User," "you") and
          {company} ("we," "us," "our"). You must be at least 13 years old to use this service.
          If you are under 18, you represent that you have your parent or legal guardian's
          permission to use the service and that they have read and agreed to these Terms on
          your behalf.</p>
          <p>We reserve the right to modify these Terms at any time. If we make material changes,
          we will notify you by email or by posting a notice on our website at least 14 days
          before changes take effect. Your continued use of the service after changes become
          effective constitutes acceptance of the new Terms.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>hypr marketing provides AI-powered Instagram content analysis and upcoming creator meeting scheduling. Our service analyzes video
          file metadata and optionally extracted visual frames to generate recommendations
            including content scores, caption suggestions, hashtag strategies, and posting time
          guidance ("Analysis").</p>
          <p><strong>Important limitations:</strong> All Analyses are AI-generated and are
          informational only. We do not guarantee any specific results including, without
          limitation, increased views, followers, engagement, or revenue. Social media algorithms
          change frequently and our recommendations may become outdated. You are solely responsible
          for your content and any decisions you make based on our Analysis.</p>
        </Section>

        <Section title="3. Accounts and Registration">
          <p>Some features require account registration. You agree to provide accurate, current,
          and complete information and to update it as necessary. You are responsible for
          maintaining the security of your account credentials. You must immediately notify us at
          {email} of any unauthorized account access.</p>
          <p>We may suspend or terminate accounts that provide false information, violate these
          Terms, or engage in fraudulent activity.</p>
        </Section>

        <Section title="4. Acceptable Use Policy">
          <p>You agree NOT to use the service to:</p>
          <ul>
            <li>Upload, analyze, or distribute content that is illegal under applicable law</li>
            <li>Upload content depicting child sexual abuse material (CSAM) — violation will
                result in immediate account termination and reporting to the National Center for
                Missing &amp; Exploited Children (NCMEC)</li>
            <li>Upload content that infringes any third party's intellectual property rights,
                including copyrighted music, films, or other media you do not have rights to</li>
            <li>Upload content depicting non-consensual sexual acts or intimate imagery
                without subject's consent</li>
            <li>Circumvent, disable, or interfere with security features of the service</li>
            <li>Use automated tools (bots, scrapers) to access the service without written
                permission</li>
            <li>Attempt to reverse-engineer, decompile, or extract source code from the service</li>
            <li>Resell or sublicense access to the service without authorization</li>
            <li>Submit misleading, false, or fraudulent content for analysis</li>
            <li>Use the service for spam generation, phishing, or deceptive marketing</li>
            <li>Upload malicious files, malware, or code designed to harm systems</li>
            <li>Probe, scan, or test the vulnerability of our systems</li>
          </ul>
          <p>Violation of this policy may result in immediate account termination without refund
          and, where applicable, reporting to law enforcement.</p>
        </Section>

        <Section title="5. AI-Generated Content Disclaimer">
          <p>Our service uses artificial intelligence to generate content including captions,
          hashtags, and recommendations. You acknowledge and agree that:</p>
          <ul>
            <li>AI-generated content may be inaccurate, incomplete, or inappropriate for your
                specific situation</li>
            <li>You must review all AI-generated content before publishing or using it</li>
            <li>You are solely responsible for content you publish based on our suggestions</li>
            <li>We do not guarantee that suggested hashtags, captions, or strategies will
                achieve any particular result</li>
            <li>AI outputs may occasionally reproduce patterns that resemble existing content;
                you should independently verify that any content you publish does not infringe
                third-party rights</li>
            <li>In jurisdictions requiring disclosure of AI-generated content (including
                California AB 587 and applicable FTC guidelines), you are responsible for
                making such disclosures</li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <h3 style={s.h3}>Your Content</h3>
          <p>You retain all ownership rights in video files you upload and content you create.
          By using the service, you grant us a limited, non-exclusive, royalty-free license
          to process your video metadata and extracted frames solely for the purpose of
          providing the Analysis to you. We do not claim ownership of your content and do not
          use it to train AI models.</p>

          <h3 style={s.h3}>AI-Generated Outputs</h3>
          <p>Analysis outputs (captions, hashtags, recommendations) generated for you are
          provided to you without restriction. You may use them freely. We make no copyright
          claims over AI-generated outputs.</p>

          <h3 style={s.h3}>Our Service</h3>
          <p>The hypr marketing platform, branding, technology, and software are owned by us and
          protected by applicable intellectual property laws. You may not copy, modify, or
          create derivative works of our platform without written permission.</p>
        </Section>

        <Section title="7. Billing and Subscription">
          <h3 style={s.h3}>Free Plan</h3>
          <p>The free plan is provided at no charge with limited usage (4 analyses per month).
          We reserve the right to modify or discontinue the free plan with 30 days' notice.</p>

          <h3 style={s.h3}>Paid Plans</h3>
          <p>Paid subscriptions are billed in advance on a monthly or annual basis. Prices are
          in USD and are subject to applicable taxes. We reserve the right to change pricing
          with 30 days' notice to existing subscribers.</p>

          <h3 style={s.h3}>Free Trials</h3>
          <p>Free trials are available for new subscribers only, one trial per account. At the
          end of the trial period, your subscription will automatically renew and your payment
          method will be charged unless you cancel before the trial ends.</p>

          <h3 style={s.h3}>Cancellation</h3>
          <p>You may cancel your subscription at any time through the billing portal in your
          dashboard. Cancellation takes effect at the end of your current billing period.
          You will retain access to paid features until that date.</p>

          <h3 style={s.h3}>Refunds</h3>
          <p>If you are not satisfied with your first paid month (or annual period), contact us
          at {email} within 14 days of your first charge for a full refund. We do not provide
          refunds for subsequent billing periods or for unused portions of a cancelled
          subscription, except where required by applicable law. Refunds are not provided
          for violations of these Terms.</p>

          <h3 style={s.h3}>Failed Payments</h3>
          <p>If payment fails, we may downgrade your account to the free plan after a grace
          period of 7 days. We will attempt to notify you by email before downgrading.</p>
        </Section>

        <Section title="8. Privacy">
          <p>Your privacy is important to us. Please review our{" "}
          <a href="/legal/privacy" style={s.link}>Privacy Policy</a>, which is incorporated
          into these Terms by reference and explains how we collect, use, and protect your
          information.</p>
        </Section>

        <Section title="9. Third-Party Services">
          <p>Our service integrates with third-party providers including Anthropic (AI analysis),
          OpenAI (transcription), Clerk (authentication), Stripe (payment processing), and
          Supabase (data storage). Your use of these services is subject to their respective
          terms and privacy policies. We are not responsible for third-party service outages,
          errors, or data handling.</p>
        </Section>

        <Section title="10. Disclaimers">
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
          EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM
          ALL WARRANTIES INCLUDING, WITHOUT LIMITATION:</p>
          <ul>
            <li>WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT</li>
            <li>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE</li>
            <li>WARRANTIES REGARDING THE ACCURACY OR COMPLETENESS OF AI-GENERATED CONTENT</li>
            <li>WARRANTIES THAT OUR RECOMMENDATIONS WILL RESULT IN INCREASED ENGAGEMENT
                OR FOLLOWERS</li>
          </ul>
          <p>Some jurisdictions do not allow the exclusion of implied warranties, so some of
          the above exclusions may not apply to you.</p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {company.toUpperCase()}
          BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          INCLUDING LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING FROM YOUR USE OF OR
          INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY
          OF SUCH DAMAGES.</p>
          <p>OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO
          THE SERVICE SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID US IN THE
          12 MONTHS BEFORE THE CLAIM AROSE, OR (B) ONE HUNDRED DOLLARS ($100).</p>
          <p>Some jurisdictions do not allow limitation of liability for personal injury or
          certain other damages, so this limitation may not apply to you.</p>
        </Section>

        <Section title="12. Indemnification">
          <p>You agree to indemnify, defend, and hold harmless {company} and its officers,
          directors, employees, and agents from and against any claims, liabilities, damages,
          judgments, awards, losses, costs, or expenses (including reasonable attorneys' fees)
          arising out of: (a) your violation of these Terms; (b) your use of the service;
          (c) content you upload or publish; or (d) your violation of any applicable law
          or third-party rights.</p>
        </Section>

        <Section title="13. Governing Law and Dispute Resolution">
          <p>These Terms are governed by the laws of the State of Delaware, without regard
          to its conflict of law principles.</p>
          <p><strong>Informal Resolution:</strong> Before filing a claim, you agree to first
          contact us at {email} and attempt to resolve the dispute informally for 30 days.</p>
          <p><strong>Arbitration:</strong> If informal resolution fails, any dispute shall be
          resolved by binding arbitration under the JAMS Streamlined Arbitration Rules. The
          arbitration will be conducted in English on a documents-only basis unless the
          arbitrator decides an in-person hearing is necessary. <strong>You waive the right
          to a jury trial and to participate in class action lawsuits.</strong></p>
          <p><strong>Small Claims Exception:</strong> Either party may bring claims in small
          claims court instead of arbitration if the claim qualifies.</p>
          <p><strong>EU/UK Users:</strong> If you are located in the EU or UK, you retain the
          right to bring claims before the courts of your country of residence and to use
          applicable alternative dispute resolution schemes.</p>
        </Section>

        <Section title="14. Termination">
          <p>We may suspend or terminate your access to the service at any time, with or without
          cause, with reasonable notice where practicable. Reasons may include: violation of
          these Terms, non-payment, abuse of the service, or legal requirements.</p>
          <p>Upon termination: (a) your right to use the service ceases immediately; (b) we may
          delete your account data per our Privacy Policy; (c) provisions of these Terms that
          by their nature should survive termination will survive, including Sections 5, 6, 10,
          11, 12, and 13.</p>
        </Section>

        <Section title="15. General Provisions">
          <ul>
            <li><strong>Entire Agreement:</strong> These Terms, our Privacy Policy, and any
                additional terms you accept constitute the entire agreement between you and us.</li>
            <li><strong>Severability:</strong> If any provision is found unenforceable, it will
                be modified to the minimum extent necessary, and the remaining provisions
                will remain in effect.</li>
            <li><strong>No Waiver:</strong> Our failure to enforce any provision does not
                constitute a waiver of our right to enforce it later.</li>
            <li><strong>Assignment:</strong> You may not assign your rights under these Terms
                without our written consent. We may assign our rights in connection with a
                merger, acquisition, or sale of assets.</li>
            <li><strong>Notices:</strong> Legal notices to us must be sent to {email}. We may
                provide notices to you via email or by posting to the service.</li>
          </ul>
        </Section>

        <div style={s.contact}>
          <strong>Questions about these Terms?</strong><br />
          Contact us at <a href={`mailto:${email}`} style={s.link}>{email}</a>
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
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: "0.5px solid #2A2A2A", letterSpacing: -0.3 },
  h3: { fontSize: 15, fontWeight: 600, marginTop: 16, marginBottom: 8 },
  link: { color: "#FF2D55", textDecoration: "none" },
  contact: { marginTop: 48, padding: "20px 22px", background: "#141414", border: "0.5px solid #2A2A2A", borderRadius: 14, fontSize: 14, lineHeight: 2, color: "#aaa" },
};
