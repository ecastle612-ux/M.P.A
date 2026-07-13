import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "./providers";
import { RegisterServiceWorker } from "../components/pwa/register-service-worker";

export const metadata: Metadata = {
  title: "M.P.A. Foundation",
  description: "M.P.A. phase 2 foundation scaffold",
  applicationName: "M.P.A."
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
