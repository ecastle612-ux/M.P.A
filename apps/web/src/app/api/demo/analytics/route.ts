import { NextResponse } from "next/server";
import { COM_002_FLAGS, DEMO_ANALYTICS_EVENTS } from "@mpa/shared";
import { trackDemoAnalytics } from "../../../../lib/demo/session-store";

const ALLOWED = new Set<string>(Object.values(DEMO_ANALYTICS_EVENTS));

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    return NextResponse.json({ error: "demo_disabled" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
    event?: string;
    meta?: Record<string, string>;
  };
  if (!body.sessionId || !body.event || !ALLOWED.has(body.event)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }
  // Never persist PII — meta values are short labels only.
  const safeMeta: Record<string, string> = {};
  if (body.meta) {
    for (const [key, value] of Object.entries(body.meta)) {
      if (typeof value === "string" && value.length <= 64) {
        safeMeta[key] = value;
      }
    }
  }
  trackDemoAnalytics(body.sessionId, body.event, safeMeta);
  return NextResponse.json({ ok: true });
}
