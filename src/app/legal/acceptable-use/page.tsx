// src/app/legal/acceptable-use/page.tsx

export const metadata = {
  title: "Acceptable Use Policy - hypr marketing",
};

export default function AupPage() {
  const updated = "January 1, 2025";
  const email = "abuse@hyprmarketing.app";

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>Acceptable Use Policy</h1>
        <p style={s.meta}>Last updated: {updated}</p>

        <div style={s.intro}>
          This Acceptable Use Policy ("AUP") applies to all users of hypr marketing and supplements
          our Terms of Service. Violations may result in immediate account suspension, permanent
          termination, and referral to law enforcement.
        </div>

        <Section title="Prohibited Content">
          <p>You must not upload, analyze, or use our service to generate strategy for content that:</p>
          <ul>
            <li><strong>Child exploitation:</strong> Depicts, promotes, or facilitates the
                sexual exploitation or abuse of minors. Any such material will be immediately
                reported to NCMEC and relevant law enforcement.</li>
            <li><strong>Non-consensual intimate imagery:</strong> Contains sexually explicit
                images of real people shared without their consent ("revenge porn")</li>
            <li><strong>Incitement to violence:</strong> Calls for or glorifies violence
                against specific individuals or groups</li>
            <li><strong>Terrorism and extremism:</strong> Promotes, glorifies, or recruits
                for terrorist organizations or violent extremist groups</li>
            <li><strong>Illegal products/services:</strong> Promotes the sale of regulated
                substances, counterfeit goods, weapons without license, or other illegal items</li>
            <li><strong>Harassment and bullying:</strong> Is designed to harass, intimidate,
                threaten, or dox specific individuals</li>
            <li><strong>Deceptive content:</strong> Constitutes coordinated inauthentic
                behavior, deepfakes designed to deceive, or AI-generated content presented
                as human-created without disclosure where legally required</li>
            <li><strong>Hate speech:</strong> Promotes hatred against people on the basis of
                race, ethnicity, national origin, religion, gender, sexual orientation,
                disability, or other protected characteristics</li>
            <li><strong>Malware:</strong> Contains or links to viruses, trojans, spyware, or
                other malicious software</li>
          </ul>
        </Section>

        <Section title="Prohibited Behaviors">
          <p>You must not:</p>
          <ul>
            <li>Use automated tools, bots, or scripts to access the service without written
                authorization from us</li>
            <li>Attempt to circumvent rate limits, access controls, or subscription
                restrictions through technical means</li>
            <li>Share account credentials or subscription access with others</li>
            <li>Use the service to generate analysis for content you do not have rights to</li>
            <li>Attempt to extract, reverse-engineer, or reproduce our AI prompts or
                proprietary analysis methodology</li>
            <li>Probe or test the security of our systems without explicit written authorization
                (if you find a vulnerability, report it to security@hyprmarketing.app)</li>
            <li>Abuse our free trial or refund policy (one trial per person; refunds are for
                genuine dissatisfaction, not to obtain free service)</li>
            <li>Create multiple accounts to circumvent usage limits</li>
          </ul>
        </Section>

        <Section title="Platform Terms Compliance">
          <p>Our service provides recommendations for Instagram content. You are solely
          responsible for ensuring that your use of our recommendations complies with:</p>
          <ul>
            <li>Instagram's Terms of Use and Community Guidelines</li>
            <li>Meta's Advertising Policies (if running paid promotions)</li>
            <li>FTC Endorsement Guidelines (disclosure of paid partnerships, AI-generated
                content where required)</li>
            <li>All applicable copyright laws (do not use copyrighted music, footage, or
                images without proper licensing)</li>
            <li>All applicable laws in your jurisdiction regarding commercial communication</li>
          </ul>
          <p>We are not affiliated with Instagram or Meta and cannot guarantee that our
          recommendations comply with their policies at any given time, as those policies
          change frequently.</p>
        </Section>

        <Section title="Reporting Violations">
          <p>To report abuse, illegal content, or policy violations, contact us at{" "}
          <a href={`mailto:${email}`} style={s.link}>{email}</a>. Include as much detail as
          possible. We take all reports seriously and will investigate promptly.</p>
          <p>For urgent matters involving child safety, also contact:</p>
          <ul>
            <li>NCMEC CyberTipline: <a href="https://www.missingkids.org" style={s.link} target="_blank" rel="noopener noreferrer">missingkids.org</a></li>
            <li>INHOPE: <a href="https://www.inhope.org" style={s.link} target="_blank" rel="noopener noreferrer">inhope.org</a></li>
          </ul>
        </Section>

        <Section title="Enforcement">
          <p>Violations of this AUP may result in:</p>
          <ul>
            <li>Immediate suspension of your account pending investigation</li>
            <li>Permanent termination without refund</li>
            <li>Reporting of illegal content and user information to appropriate law
                enforcement authorities</li>
            <li>Civil or criminal liability where applicable</li>
          </ul>
          <p>We reserve the right to determine, in our sole discretion, what constitutes
          a violation of this AUP. Our decisions regarding enforcement are final.</p>
        </Section>

        <div style={s.contact}>
          <strong>Report abuse:</strong>{" "}
          <a href={`mailto:${email}`} style={s.link}>{email}</a><br />
          <strong>Security disclosures:</strong>{" "}
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
