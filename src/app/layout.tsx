// src/app/layout.tsx

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import SkipNav from "@/components/skip-nav";
import "./globals.css";

// Inter replaces the aggressive heavy system font stack.
// subsets: latin keeps the bundle small.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "Hypr Marketing",
  title: {
    default: "Hypr Marketing — AI Video Analysis for Creators",
    template: "%s | Hypr Marketing",
  },
  description:
    "Analyze short-form video performance with AI and prepare for creator meeting scheduling — Hypr Marketing.",
  keywords: [
    "Instagram Reels analyzer",
    "creator marketing",
    "short form video analysis",
    "influencer marketing platform",
    "hypr marketing",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hypr Marketing — AI Video Analysis for Creators",
    description: "AI-powered short-form video analysis. Creator meeting scheduling coming soon.",
    url: "/",
    siteName: "Hypr Marketing",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hypr Marketing — AI video analysis for creators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hypr Marketing — AI Video Analysis for Creators",
    description: "Analyze content performance. Creator meeting scheduling coming soon.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#FF2D55",
          colorBackground: "#121417",
          colorText: "#F7F2EA",
          colorTextSecondary: "#A8B0BA",
          colorInputText: "#F7F2EA",
          colorInputBackground: "#0D0F12",
          colorDanger: "#FF7A96",
          borderRadius: "8px",
          // Use Inter inside Clerk modals too
          fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif",
        },
        elements: {
          rootBox:                          { color: "#F7F2EA" },
          card:                             { backgroundColor: "#121417", border: "1px solid #2A3038", boxShadow: "0 24px 80px rgba(0,0,0,.42)", color: "#F7F2EA" },
          headerTitle:                      { color: "#F7F2EA" },
          headerSubtitle:                   { color: "#A8B0BA" },
          formFieldLabel:                   { color: "#D7DDE5" },
          formFieldInput:                   { backgroundColor: "#0D0F12", borderColor: "#3A414C", color: "#F7F2EA" },
          formFieldInputShowPasswordButton: { color: "#D7DDE5" },
          formButtonPrimary:                { background: "linear-gradient(135deg,#FF4D5E,#FF8A3D)", color: "#FFFFFF" },
          socialButtonsBlockButton:         { backgroundColor: "#181B20", borderColor: "#3A414C", color: "#F7F2EA" },
          dividerLine:                      { backgroundColor: "#2A3038" },
          dividerText:                      { color: "#A8B0BA" },
          identityPreviewText:              { color: "#F7F2EA" },
          identityPreviewEditButton:        { color: "#5EEAD4" },
          formFieldAction:                  { color: "#5EEAD4" },
          footer:                           { background: "#121417" },
          footerActionText:                 { color: "#A8B0BA" },
          footerActionLink:                 { color: "#5EEAD4" },
          modalBackdrop:                    { backgroundColor: "rgba(0,0,0,.72)" },
        },
      }}
    >
      <html lang="en" className={inter.variable}>
        <body
          style={{
            background: "#0A0A0A",
            color: "#F5F0E8",
            minHeight: "100vh",
            // Inter as the base font; falls back gracefully on Windows
            fontFamily: "var(--font-inter, 'Segoe UI', system-ui, sans-serif)",
          }}
        >
          <SkipNav />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
