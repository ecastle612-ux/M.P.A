import type { MetadataRoute } from "next";
import { ACQ_INDEXABLE_PATHS, ACQ_NOINDEX_PATHS } from "../lib/acquire/seo";
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
      allow: [...ACQ_INDEXABLE_PATHS, "/login", "/forgot-password"],
      disallow: [
        ...ACQ_NOINDEX_PATHS,
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
        "/profile",
        "/inbox",
        "/master-admin",
        "/first-login",
        "/accept-invitation"
      ]
    },
    sitemap: `${base}/sitemap.xml`
  };
}
