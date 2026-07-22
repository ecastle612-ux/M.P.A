import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { BrandSurfaceTone } from "../components/branding/brand-logo";
import { RegisterServiceWorker } from "../components/pwa/register-service-worker";
import {
  MPA_APPLE_TOUCH_ICON_PATH,
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  MPA_FAVICON_16_PATH,
  MPA_FAVICON_32_PATH,
  MPA_LOGO_INTRINSIC_SIZE,
  brandMetadataIconEntries,
  resolveBrandAssetUrl
} from "../lib/branding";
import { serverEnv } from "../lib/env/server-env";
import { readServerThemeState } from "../lib/theme/read-theme-cookies";
import { brandSurfaceToneForMode, buildThemeInitScript } from "../lib/theme/theme-sync";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap"
});

const appUrl = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
const siteDescription = `${MPA_BRAND_NAME} — enterprise property operations for professional managers. Private Beta.`;
const themeInitScript = buildThemeInitScript();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${MPA_BRAND_NAME} | ${MPA_BRAND_TAGLINE}`,
    template: `%s | ${MPA_BRAND_NAME}`
  },
  description: siteDescription,
  applicationName: MPA_BRAND_NAME,
  alternates: {
    canonical: appUrl
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  },
  icons: {
    icon: [
      ...brandMetadataIconEntries(),
      { url: MPA_FAVICON_32_PATH, sizes: "32x32", type: "image/png" },
      { url: MPA_FAVICON_16_PATH, sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: MPA_APPLE_TOUCH_ICON_PATH, sizes: "180x180", type: "image/png" }],
    shortcut: MPA_FAVICON_32_PATH
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: MPA_BRAND_NAME,
    title: `${MPA_BRAND_NAME} | ${MPA_BRAND_TAGLINE}`,
    description: siteDescription,
    images: [
      {
        url: resolveBrandAssetUrl("browser", "light-surface").src,
        width: MPA_LOGO_INTRINSIC_SIZE,
        height: MPA_LOGO_INTRINSIC_SIZE,
        alt: `${MPA_BRAND_NAME} logo`
      }
    ]
  },
  twitter: {
    card: "summary",
    title: `${MPA_BRAND_NAME} | ${MPA_BRAND_TAGLINE}`,
    description: siteDescription,
    images: [resolveBrandAssetUrl("browser", "light-surface").src]
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = await readServerThemeState();
  const brandTone = brandSurfaceToneForMode(theme.mode);

  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
      data-theme={theme.mode}
      suppressHydrationWarning
    >
      <head>
        <Script id="mpa-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <BrandSurfaceTone tone={brandTone}>
          <AppProviders initialMode={theme.mode} initialPreference={theme.preference}>
            <RegisterServiceWorker />
            {children}
          </AppProviders>
        </BrandSurfaceTone>
      </body>
    </html>
  );
}
