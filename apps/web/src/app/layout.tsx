import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { RegisterServiceWorker } from "../components/pwa/register-service-worker";

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

export const metadata: Metadata = {
  title: "M.P.A. — My Property Assistant",
  description: "AI Property Operations Platform foundation",
  applicationName: "M.P.A."
};

export const viewport: Viewport = {
  themeColor: "#0F6B56",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body
        className={ibmPlexSans.className}
        style={
          {
            "--mpa-font-sans": "var(--font-ibm-plex-sans), \"Segoe UI\", system-ui, sans-serif",
            "--mpa-font-display":
              "Satoshi, var(--font-ibm-plex-sans), \"Segoe UI\", system-ui, sans-serif",
            "--mpa-font-mono": "var(--font-ibm-plex-mono), ui-monospace, monospace"
          } as CSSProperties
        }
      >
        <AppProviders>
          <RegisterServiceWorker />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
