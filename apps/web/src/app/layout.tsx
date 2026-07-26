import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
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
import {
  MPA_PWA_THEME_COLOR_DARK,
  MPA_PWA_THEME_COLOR_LIGHT
} from "../lib/pwa/native-shell-theme";
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


/** PMX-004 Phase 3 — native viewport + status theme (viewport-fit=cover unlocks safe-area). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: MPA_PWA_THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: MPA_PWA_THEME_COLOR_DARK },
    { color: MPA_PWA_THEME_COLOR_LIGHT }
  ]
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${MPA_BRAND_NAME} | ${MPA_BRAND_TAGLINE}`,
    template: `%s | ${MPA_BRAND_NAME}`
  },
  description: siteDescription,
  applicationName: MPA_BRAND_NAME,
  appleWebApp: {
    capable: true,
    title: MPA_BRAND_NAME,
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
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
        {/*
          PMX-004 Phase 8 / M0-PERF Option B:
          Theme/Toast/AuthSessionSync mount only via ShellProviders on (app)/(portals).
          Auth routes stay CSS-token-only (html[data-theme] + globals) to cut hydration.
          SW registration stays root-scoped for install/A2HS on /login.
        */}
        <BrandSurfaceTone tone={brandTone}>
          <RegisterServiceWorker />
          {children}
        </BrandSurfaceTone>
      </body>
    </html>
  );
}
