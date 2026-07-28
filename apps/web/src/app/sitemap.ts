import type { MetadataRoute } from "next";
import { ACQ_INDEXABLE_PATHS } from "../lib/acquire/seo";
import { serverEnv } from "../lib/env/server-env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const isProductionHost = /my-property-assistant\.com$/i.test(new URL(base).hostname);
  if (!isProductionHost) return [];

  const lastModified = new Date();
  const marketing: MetadataRoute.Sitemap = ACQ_INDEXABLE_PATHS.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/pricing" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/pricing" ? 0.9 : 0.7
  }));

  return [
    ...marketing,
    {
      url: `${base}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${base}/forgot-password`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2
    }
  ];
}
