import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { RegisterServiceWorker } from "../components/pwa/register-service-worker";
import {
  MPA_APPLE_TOUCH_ICON_PATH,
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  MPA_FAVICON_16_PATH,
  MPA_FAVICON_32_PATH,
  MPA_LOGO_DARK_PATH,
  MPA_LOGO_LIGHT_PATH
} from "../lib/branding";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "M.P.A. — My Property Assistant",
  description: "Property operations for portfolio managers, residents, vendors, and owners.",
  applicationName: MPA_BRAND_NAME,
  appleWebApp: {
    capable: true,
    title: MPA_BRAND_NAME,
    statusBarStyle: "default"
  },
  icons: {
    // Prefer house-mark favicons for browser tabs — full lockups are illegible at 16–32px.
    icon: [
      { url: MPA_FAVICON_32_PATH, sizes: "32x32", type: "image/png" },
      { url: MPA_FAVICON_16_PATH, sizes: "16x16", type: "image/png" },
      { url: "/icons/mpa-mark-192.png", sizes: "192x192", type: "image/png" },
      {
        url: MPA_LOGO_DARK_PATH,
        type: "image/png",
        sizes: "512x512",
        media: "(prefers-color-scheme: light)"
      },
      {
        url: MPA_LOGO_LIGHT_PATH,
        type: "image/png",
        sizes: "512x512",
        media: "(prefers-color-scheme: dark)"
      }
    ],
    apple: [{ url: MPA_APPLE_TOUCH_ICON_PATH, sizes: "180x180", type: "image/png" }],
    shortcut: MPA_FAVICON_32_PATH
  },
  openGraph: {
    siteName: MPA_BRAND_NAME,
    title: `${MPA_BRAND_NAME} — ${MPA_BRAND_TAGLINE}`,
    images: [{ url: MPA_LOGO_DARK_PATH, width: 512, height: 512, alt: `${MPA_BRAND_NAME} logo` }]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className={plexSans.className}>
        <AppProviders>
          <RegisterServiceWorker />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
