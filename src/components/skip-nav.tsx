"use client";

// src/components/skip-nav.tsx
// ADA / WCAG 2.1 AA — Success Criterion 2.4.1 Bypass Blocks.
// Renders as a visually hidden link that becomes visible on keyboard focus.
// Must be a Client Component because it uses onFocus/onBlur handlers.

export default function SkipNav() {
  return (
    <a
      href="#main-content"
      className="skip-nav"
      onFocus={(e) => {
        const el = e.currentTarget;
        el.style.left = "1rem";
        el.style.top = "1rem";
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.overflow = "visible";
        el.style.zIndex = "9999";
      }}
      onBlur={(e) => {
        const el = e.currentTarget;
        el.style.left = "-9999px";
        el.style.top = "auto";
        el.style.width = "1px";
        el.style.height = "1px";
        el.style.overflow = "hidden";
        el.style.zIndex = "auto";
      }}
      style={{
        position: "fixed",
        left: "-9999px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        background: "#fff",
        color: "#000",
        padding: "8px 16px",
        borderRadius: "6px",
        fontWeight: 600,
        fontSize: "14px",
        textDecoration: "none",
      }}
    >
      Skip to main content
    </a>
  );
}
