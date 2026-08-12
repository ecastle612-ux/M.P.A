import type { MetadataRoute } from "next";

/**
 * PPS1-022 — indexable public marketing routes only.
 * Excludes Live Demo, authenticated app, admin, and private commerce flows.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env["NEXT_PUBLIC_APP_URL"] ?? "https://mypropertyassistant.com").replace(
    /\/$/,
    ""
  );
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/modules`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/get-started`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/enterprise`, lastModified: now, changeFrequency: "monthly", priority: 0.6 }
  ];
}
