import type { MetadataRoute } from "next";
import { serverEnv } from "../lib/env/server-env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const isProductionHost = /my-property-assistant\.com$/i.test(new URL(base).hostname);
  if (!isProductionHost) return [];

  const lastModified = new Date();
  return [
    {
      url: `${base}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${base}/forgot-password`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3
    }
  ];
}
