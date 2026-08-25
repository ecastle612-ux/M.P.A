import { PARTNER_REF_COOKIE, parsePartnerRefParam } from "@mpa/shared";

export const PARTNER_REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export type PartnerRefCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

export function partnerRefCookieOptions(): PartnerRefCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: PARTNER_REF_COOKIE_MAX_AGE
  };
}

export function readPartnerRefCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq);
    if (name !== PARTNER_REF_COOKIE) continue;
    return parsePartnerRefParam(decodeURIComponent(part.slice(eq + 1)));
  }
  return null;
}

export function partnerRefFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const fromQuery = parsePartnerRefParam(url.searchParams.get("ref"));
  const fromCookie = readPartnerRefCookie(request.headers.get("cookie"));
  return fromCookie ?? fromQuery;
}

export function firstWinsPartnerRef(existingCookie: string | null | undefined, incoming: string | null | undefined): string | null {
  const current = parsePartnerRefParam(existingCookie);
  if (current) return current;
  return parsePartnerRefParam(incoming);
}
