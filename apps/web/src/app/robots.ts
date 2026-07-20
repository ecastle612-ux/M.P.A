import type { MetadataRoute } from "next";
import { serverEnv } from "../lib/env/server-env";

export default function robots(): MetadataRoute.Robots {
  const base = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const isProductionHost = /my-property-assistant\.com$/i.test(new URL(base).hostname);

  if (!isProductionHost) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/"
      }
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/forgot-password"],
      disallow: [
        "/dashboard",
        "/portal",
        "/api/",
        "/settings",
        "/properties",
        "/units",
        "/facility",
        "/financials",
        "/maintenance",
        "/migration",
        "/applicants",
        "/tenants",
        "/leases",
        "/vendors",
        "/communications",
        "/residents",
        "/ai-operations",
        "/setup",
        "/profile"
      ]
    },
    sitemap: `${base}/sitemap.xml`
  };
}
