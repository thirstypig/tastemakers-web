import type { Metadata } from "next";
import { JetBrains_Mono, Playfair_Display, Roboto } from "next/font/google";
import "./globals.css";
// Design tokens + primitives for the app surface. Loaded after globals so the
// admin themes there keep their own --tm-ink / --tm-muted, and before any
// feature stylesheet, which layers on top.
import "@/styles/tokens.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { Analytics } from "@/components/Analytics";
import Script from "next/script";
import { Suspense } from "react";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

// Stands in for the wordmark's Didone serif. Headings only — body, tags,
// buttons and addresses stay Roboto, matching the app's 1.1.103 switch.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tastemakers",
  description: "Discover restaurants through trusted tastemakers",
  verification: {
    google: "PYYV7mwMmTDi0yGeN3SNUHlKsQDHDJVhuMztZcIttw8",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${roboto.variable} ${playfair.variable}`}
    >
      <head>
        {/* GA4 + AdSense + Consent Mode v2 */}
        <Analytics />
        {/* Plausible */}
        <Script
          defer
          data-domain="app.tastemakersapp.com"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <PostHogProvider>
            <AuthProvider>{children}</AuthProvider>
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
