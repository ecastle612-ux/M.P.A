import { NextResponse } from "next/server";
import { PARTNER_ANALYTICS_EVENTS, PARTNER_APPLY_MAX_BYTES } from "@mpa/shared";
import { submitPartnerApplication } from "../../../../lib/partners/service";
import { loadPartnerDeps } from "../../../../lib/partners/runtime";
import { consumeRateLimit, requestActorKey } from "../../../../lib/security/durable-rate-limit";
import { trackEvent } from "../../../../lib/observability/analytics";

export const runtime = "nodejs";

const GENERIC_SUCCESS = {
  ok: true,
  message: "Thanks — we received your Partner Program application."
};

export async function POST(request: Request) {
  if (
    !(await consumeRateLimit({
      class: "PUBLIC",
      key: `partner-apply:${requestActorKey(request)}`
    }))
  ) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > PARTNER_APPLY_MAX_BYTES) {
    return NextResponse.json({ error: "Application is too large." }, { status: 413 });
  }

  const raw = await request.text().catch(() => "");
  if (raw.length > PARTNER_APPLY_MAX_BYTES) {
    return NextResponse.json({ error: "Application is too large." }, { status: 413 });
  }

  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;
    if ("organization_id" in body || "organizationId" in body || "user_id" in body || "userId" in body) {
      return NextResponse.json({ error: "Invalid application." }, { status: 400 });
    }
    if (body["intent"] === "started") {
      trackEvent({
        eventName: PARTNER_ANALYTICS_EVENTS.application_started,
        properties: { route: "/partners" }
      });
      return NextResponse.json({ ok: true });
    }
  }

  const deps = await loadPartnerDeps();
  if (!deps.durable && process.env["VITEST"] !== "true" && process.env["NODE_ENV"] === "production") {
    return NextResponse.json({ error: "Application intake is unavailable." }, { status: 503 });
  }

  try {
    const result = await submitPartnerApplication(payload, deps);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.spam) {
      trackEvent({
        eventName: PARTNER_ANALYTICS_EVENTS.application_submitted,
        properties: { route: "/partners" }
      });
    }
    return NextResponse.json(GENERIC_SUCCESS);
  } catch {
    return NextResponse.json({ error: "Application intake is unavailable." }, { status: 503 });
  }
}
