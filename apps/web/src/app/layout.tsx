import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { AppProviders } from "./providers";
import { RegisterServiceWorker } from "../components/pwa/register-service-worker";
import { ImpersonationBannerHost } from "../components/admin/impersonation-banner-host";
import {
  MPA_APPLE_TOUCH_ICON_PATH,
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  MPA_FAVICON_16_PATH,
  MPA_FAVICON_32_PATH,
  MPA_LOGO_DARK_PATH,
  MPA_LOGO_LIGHT_PATH
} from "../lib/branding";

/** Self-hosted Canopy body face — SIL OFL. See src/fonts/ibm-plex/OFL.txt */
const plexSans = localFont({
  src: [
    {
      path: "../fonts/ibm-plex/IBMPlexSans-Regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../fonts/ibm-plex/IBMPlexSans-Medium.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "../fonts/ibm-plex/IBMPlexSans-SemiBold.woff2",
      weight: "600",
      style: "normal"
    }
  ],
  variable: "--font-plex-sans",
  display: "swap"
});

/** Self-hosted Canopy mono face — SIL OFL. See src/fonts/ibm-plex/OFL.txt */
const plexMono = localFont({
  src: [
    {
      path: "../fonts/ibm-plex/IBMPlexMono-Regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../fonts/ibm-plex/IBMPlexMono-Medium.woff2",
      weight: "500",
      style: "normal"
    }
  ],
  variable: "--font-plex-mono",
  display: "swap"
});

const siteUrl = (process.env["NEXT_PUBLIC_APP_URL"] ?? "https://mypropertyassistant.com").replace(
  /\/$/,
  ""
);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "M.P.A. — My Property Assistant",
  description:
    "Property management software for portfolio managers, residents, vendors, and owners. Online rent collection, ACH rent payments, and tenant AutoPay for eligible Property Operations accounts.",
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
    type: "website",
    url: siteUrl,
    siteName: MPA_BRAND_NAME,
    title: `${MPA_BRAND_NAME} — ${MPA_BRAND_TAGLINE}`,
    description:
      "Property management software for portfolio managers, residents, vendors, and owners. Online rent collection, ACH rent payments, and tenant AutoPay for eligible Property Operations accounts.",
    images: [{ url: MPA_LOGO_DARK_PATH, width: 512, height: 512, alt: `${MPA_BRAND_NAME} logo` }]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className={plexSans.className}>
        <AppProviders>
          <RegisterServiceWorker />
          <ImpersonationBannerHost />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
