/**
 * PMX-004 Phase 4 — classify and open document/media URLs without unexpected standalone exits.
 */

export type StandaloneOpenKind = "pdf" | "image" | "document" | "external";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|heic|bmp)(\?|#|$)/i;
const PDF_EXT = /\.pdf(\?|#|$)/i;

export function classifyStandaloneHref(href: string): StandaloneOpenKind {
  const trimmed = href.trim();
  if (!trimmed) return "external";
  if (PDF_EXT.test(trimmed) || /[?&](download|format)=pdf\b/i.test(trimmed)) return "pdf";
  if (IMAGE_EXT.test(trimmed) || /\/media\//i.test(trimmed)) return "image";
  // Same-origin reporting / vault download routes — treat as documents (often PDF).
  if (
    trimmed.startsWith("/") ||
    (typeof window !== "undefined" && trimmed.startsWith(window.location.origin))
  ) {
    if (/\/api\/reporting\/versions\/.+\/download/i.test(trimmed)) return "pdf";
    if (/vault|document|invoice|statement|report/i.test(trimmed)) return "document";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed, typeof window !== "undefined" ? window.location.origin : "https://local");
      if (typeof window !== "undefined" && url.origin === window.location.origin) {
        return "document";
      }
    } catch {
      /* fall through */
    }
    return "external";
  }
  return "document";
}

export function isAppOriginHref(href: string): boolean {
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  if (typeof window === "undefined") return false;
  try {
    return new URL(href, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Prefer inline Content-Disposition for same-origin reporting downloads during preview. */
export function hrefForInAppPreview(href: string): string {
  if (!/\/api\/reporting\/versions\/.+\/download/i.test(href)) return href;
  try {
    const url = new URL(href, typeof window !== "undefined" ? window.location.origin : "https://local");
    url.searchParams.set("inline", "1");
    if (href.startsWith("/")) {
      return `${url.pathname}${url.search}`;
    }
    return url.toString();
  } catch {
    return href.includes("?") ? `${href}&inline=1` : `${href}?inline=1`;
  }
}

/** Fetch URL to a blob object URL for in-app preview (revoker must call URL.revokeObjectURL). */
export async function fetchHrefAsObjectUrl(href: string): Promise<{ objectUrl: string; contentType: string }> {
  const previewHref = hrefForInAppPreview(href);
  const absolute =
    previewHref.startsWith("/") && typeof window !== "undefined"
      ? new URL(previewHref, window.location.origin).toString()
      : previewHref;
  const res = await fetch(absolute, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Could not load file (${res.status})`);
  }
  const blob = await res.blob();
  const contentType = blob.type || res.headers.get("content-type") || "application/octet-stream";
  return { objectUrl: URL.createObjectURL(blob), contentType };
}

export function guessKindFromContentType(contentType: string, href: string): StandaloneOpenKind {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.includes("pdf")) return "pdf";
  return classifyStandaloneHref(href);
}

/** Trigger a same-window download without opening a new browsing context. */
export function triggerSameWindowDownload(href: string, filename = "download"): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
