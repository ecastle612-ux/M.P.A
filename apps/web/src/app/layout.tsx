import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "./providers";
import { RegisterServiceWorker } from "../components/pwa/register-service-worker";
import {
  MPA_APPLE_TOUCH_ICON_PATH,
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  MPA_FAVICON_16_PATH,
  MPA_FAVICON_32_PATH,
  MPA_LOGO_ASSET_PATH
} from "../lib/branding";
import { serverEnv } from "../lib/env/server-env";

export const metadata: Metadata = {
  metadataBase: new URL(serverEnv.NEXT_PUBLIC_APP_URL),
  title: `${MPA_BRAND_NAME} | ${MPA_BRAND_TAGLINE}`,
  description: `${MPA_BRAND_NAME} enterprise property management platform`,
  applicationName: MPA_BRAND_NAME,
  icons: {
    icon: [
      { url: MPA_FAVICON_32_PATH, sizes: "32x32", type: "image/png" },
      { url: MPA_FAVICON_16_PATH, sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: MPA_APPLE_TOUCH_ICON_PATH, sizes: "180x180", type: "image/png" }],
    shortcut: MPA_FAVICON_32_PATH
  },
  openGraph: {
    title: `${MPA_BRAND_NAME} | ${MPA_BRAND_TAGLINE}`,
    description: `${MPA_BRAND_NAME} enterprise property management platform`,
    images: [{ url: MPA_LOGO_ASSET_PATH, width: 2048, height: 2048, alt: `${MPA_BRAND_NAME} logo` }]
  },
  twitter: {
    card: "summary_large_image",
    title: `${MPA_BRAND_NAME} | ${MPA_BRAND_TAGLINE}`,
    description: `${MPA_BRAND_NAME} enterprise property management platform`,
    images: [MPA_LOGO_ASSET_PATH]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <RegisterServiceWorker />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
