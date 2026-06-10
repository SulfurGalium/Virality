// src/app/layout.tsx

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import SkipNav from "@/components/skip-nav";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "hypr marketing",
  title: {
    default: "hypr marketing - Creator Growth Tools",
    template: "%s | hypr marketing",
  },
  description:
    "Analyze short-form video performance now and get ready to schedule meetings with creators through hypr marketing.",
  keywords: [
    "Instagram Reels analyzer",
    "creator marketing",
    "creator meetings",
    "short form video analysis",
    "influencer marketing platform",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "hypr marketing - Creator Growth Tools",
    description: "AI-powered short-form video analysis today, creator meeting scheduling soon.",
    url: "/",
    siteName: "hypr marketing",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "hypr marketing — AI video analysis for creators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "hypr marketing - Creator Growth Tools",
    description: "Analyze content performance and prepare for creator meeting scheduling.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
        },
        elements: {
          rootBox: { color: "#F7F2EA" },
          card: {
            backgroundColor: "#121417",
            border: "1px solid #2A3038",
            boxShadow: "0 24px 80px rgba(0,0,0,.42)",
            color: "#F7F2EA",
          },
          headerTitle: { color: "#F7F2EA" },
          headerSubtitle: { color: "#A8B0BA" },
          formFieldLabel: { color: "#D7DDE5" },
          formFieldInput: {
            backgroundColor: "#0D0F12",
            borderColor: "#3A414C",
            color: "#F7F2EA",
          },
          formFieldInputShowPasswordButton: { color: "#D7DDE5" },
          formButtonPrimary: {
            background: "linear-gradient(135deg,#FF4D5E,#FF8A3D)",
            color: "#FFFFFF",
          },
          socialButtonsBlockButton: {
            backgroundColor: "#181B20",
            borderColor: "#3A414C",
            color: "#F7F2EA",
          },
          dividerLine: { backgroundColor: "#2A3038" },
          dividerText: { color: "#A8B0BA" },
          identityPreviewText: { color: "#F7F2EA" },
          identityPreviewEditButton: { color: "#5EEAD4" },
          formFieldAction: { color: "#5EEAD4" },
          footer: { background: "#121417" },
          footerActionText: { color: "#A8B0BA" },
          footerActionLink: { color: "#5EEAD4" },
          modalBackdrop: { backgroundColor: "rgba(0,0,0,.72)" },
        },
      }}
    >
      <html lang="en">
        <body style={{ background: "#0A0A0A", color: "#F5F0E8", minHeight: "100vh" }}>
          <SkipNav />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
