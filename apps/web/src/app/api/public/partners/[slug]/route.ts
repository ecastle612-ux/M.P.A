import { NextResponse } from "next/server";
import { PARTNER_PORTAL_ANALYTICS_EVENTS, PARTNER_REQUEST_MAX_BYTES } from "@mpa/shared";
import { loadPartnerRequestDeps } from "../../../../../lib/partners/request-deps";
import {
  publicPartnerUnavailable,
  resolveLivePartnerPortal,
  submitPartnerServiceRequest
} from "../../../../../lib/partners/request-service";
import { consumeRateLimit, requestActorKey } from "../../../../../lib/security/durable-rate-limit";
import { trackEvent } from "../../../../../lib/observability/analytics";

export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

function unavailable(status = 404) {
  return NextResponse.json(publicPartnerUnavailable(), { status });
}

export async function GET(request: Request, context: Params) {
  const { slug } = await context.params;
  if (
    !(await consumeRateLimit({
      class: "PUBLIC",
      key: `partner-portal-get:${slug}:${requestActorKey(request)}`
    }))
  ) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  try {
    const deps = await loadPartnerRequestDeps();
    if (!deps.durable && process.env["VITEST"] !== "true" && process.env["NODE_ENV"] === "production") {
      return NextResponse.json({ error: "This request link is not available." }, { status: 503 });
    }
    const live = await resolveLivePartnerPortal(slug, deps);
    if (!live) return unavailable();
    trackEvent({
      eventName: PARTNER_PORTAL_ANALYTICS_EVENTS.portal_viewed,
      properties: { route: `/request/${slug}` }
    });
    return NextResponse.json(live.public);
  } catch {
    return unavailable(503);
  }
}

export async function POST(request: Request, context: Params) {
  const { slug } = await context.params;
  if (
    !(await consumeRateLimit({
      class: "PUBLIC",
      key: `partner-portal-post:${slug}:${requestActorKey(request)}`
    }))
  ) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > PARTNER_REQUEST_MAX_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }
  const raw = await request.text().catch(() => "");
  if (raw.length > PARTNER_REQUEST_MAX_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const deps = await loadPartnerRequestDeps();
    if (!deps.durable && process.env["VITEST"] !== "true" && process.env["NODE_ENV"] === "production") {
      return NextResponse.json({ error: "This request link is not available." }, { status: 503 });
    }
    const result = await submitPartnerServiceRequest(slug, payload, deps);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.unavailable ? 404 : 400 }
      );
    }
    if (!result.spam) {
      trackEvent({
        eventName: PARTNER_PORTAL_ANALYTICS_EVENTS.request_submitted,
        properties: { route: `/request/${slug}` }
      });
    }
    return NextResponse.json({
      ok: true,
      publicRef: result.publicRef ?? null,
      statusToken: result.statusToken ?? null,
      statusPath: result.statusToken ? `/request/status/${result.statusToken}` : null
    });
  } catch {
    return NextResponse.json({ error: "This request link is not available." }, { status: 503 });
  }
}
