// src/components/site-footer.tsx
// Shared legal + accessibility footer — appears on every page.
// Uses CSS variables from globals.css so it matches the design system.

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer
      aria-label="Site footer"
      style={{
        borderTop: "1px solid var(--line)",
        marginTop: 64,
        padding: "32px 0 40px",
        width: "min(1120px, 100%)",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {/* Top row — brand + legal links */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 24,
        marginBottom: 20,
      }}>
        {/* Brand */}
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}
          aria-label="Hypr Marketing home"
        >
          <span
            aria-hidden="true"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "white",
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            h
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            Hypr Marketing
          </span>
        </Link>

        {/* Legal links */}
        <nav aria-label="Legal navigation" style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
          {[
            { href: "/legal/terms",          label: "Terms of Service" },
            { href: "/legal/privacy",        label: "Privacy Policy" },
            { href: "/legal/acceptable-use", label: "Acceptable Use" },
            { href: "/legal/security",       label: "Security" },
            { href: "/pricing",              label: "Pricing" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom row — copyright + accessibility statement */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 12,
        paddingTop: 16,
        borderTop: "1px solid var(--line)",
      }}>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          © {new Date().getFullYear()} Hypr Marketing. All rights reserved.
        </p>

        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", textAlign: "right" as const }}>
          This product targets{" "}
          <a
            href="https://www.w3.org/WAI/WCAG21/quickref/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--teal)", textDecoration: "underline" }}
          >
            WCAG 2.1 Level AA
          </a>
          .{" "}
          <a
            href="mailto:accessibility@hyprmarketing.app"
            style={{ color: "var(--teal)", textDecoration: "underline" }}
          >
            Report an accessibility issue
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
