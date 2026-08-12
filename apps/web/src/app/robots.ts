import type { MetadataRoute } from "next";

/**
 * PPS1-022 — public crawl rules.
 * Demo, authenticated app, admin, and private commerce routes stay out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/modules", "/pricing", "/get-started", "/enterprise"],
      disallow: [
        "/demo",
        "/demo/",
        "/admin",
        "/admin/",
        "/api/",
        "/launcher",
        "/setup",
        "/billing",
        "/profile",
        "/pm/",
        "/facility/",
        "/shared/",
        "/portal/",
        "/dashboard",
        "/settings/",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/unauthorized",
        "/checkout/",
        "/confirm-plan"
      ]
    },
    sitemap: "/sitemap.xml"
  };
}
