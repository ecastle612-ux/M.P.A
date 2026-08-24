import { NextResponse } from "next/server";
import { PARTNER_ANALYTICS_EVENTS, PARTNER_REF_COOKIE, parsePartnerRefParam } from "@mpa/shared";
import { firstWinsPartnerRef, partnerRefCookieOptions, readPartnerRefCookie } from "../../../../lib/partners/cookie";
import { consumeRateLimit, requestActorKey } from "../../../../lib/security/durable-rate-limit";
import { trackEvent } from "../../../../lib/observability/analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (
    !(await consumeRateLimit({
      class: "PUBLIC",
      key: `partner-ref:${requestActorKey(request)}`
    }))
  ) {
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json().catch(() => null)) as { ref?: unknown } | null;
  const incoming = parsePartnerRefParam(typeof body?.ref === "string" ? body.ref : null);
  const existing = readPartnerRefCookie(request.headers.get("cookie"));
  const slug = firstWinsPartnerRef(existing, incoming);
  const response = NextResponse.json({ ok: true });
  if (slug && !existing) {
    response.cookies.set(PARTNER_REF_COOKIE, slug, partnerRefCookieOptions());
    trackEvent({
      eventName: PARTNER_ANALYTICS_EVENTS.referral_link_visited,
      properties: { route: "/get-started" }
    });
  }
  return response;
}
