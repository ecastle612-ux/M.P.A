import { cookies } from "next/headers";
import { ACQUISITION_QUOTE_STATE_COOKIE } from "@mpa/shared";

/** Read signed quote-state cookie from an incoming Request (API routes). */
export function acquisitionStateTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    if (name !== ACQUISITION_QUOTE_STATE_COOKIE) continue;
    const value = trimmed.slice(eq + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

/** Read signed quote-state cookie from Next.js cookie jar (RSC / server actions). */
export async function acquisitionStateTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACQUISITION_QUOTE_STATE_COOKIE)?.value ?? null;
}
