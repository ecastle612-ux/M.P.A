import { publicRequestPath } from "@mpa/shared";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function publicRequestAbsoluteUrl(origin: string, token: string, via: "qr" | "link"): string {
  const path = publicRequestPath(token, via);
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function assertSafePublicRequestUrl(url: string): { ok: true } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "Request link is invalid." };
  }
  if (!parsed.pathname.startsWith("/request/")) {
    return { ok: false, error: "Request link is invalid." };
  }
  if (UUID_RE.test(url)) {
    return { ok: false, error: "Public request links cannot include internal identifiers." };
  }
  if (/organization_id|work_order|user_id|facility_asset/i.test(url)) {
    return { ok: false, error: "Public request links cannot include internal identifiers." };
  }
  return { ok: true };
}

/** Printable QR SVG. The encoded payload is only the public URL. */
export async function buildPublicRequestQrSvg(url: string): Promise<string> {
  const safe = assertSafePublicRequestUrl(url);
  if (!safe.ok) {
    throw new Error(safe.error);
  }
  const qrcode = await import("qrcode");
  return qrcode.toString(url, { type: "svg", margin: 2, width: 320, errorCorrectionLevel: "M" });
}
