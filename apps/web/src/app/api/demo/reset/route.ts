import { NextResponse } from "next/server";
import { readDemoCookiePair } from "../../../../lib/demo/cookie";
import { applyDemoCookies } from "../../../../lib/demo/durable-state";
import { isDemoRuntimeEnabled } from "../../../../lib/demo/demo-runtime";
import {
  resetDemoSessionRecord,
  resolveDemoSessionRecord
} from "../../../../lib/demo/session-store";

export async function POST(request: Request) {
  if (!isDemoRuntimeEnabled()) {
    return NextResponse.json({ error: "demo_disabled" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (!body.sessionId) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }

  const cookies = await readDemoCookiePair();
  const existing = resolveDemoSessionRecord({
    sessionId: body.sessionId,
    stateToken: cookies.stateToken
  });
  if (!existing) {
    return NextResponse.json({ error: "session_not_found" }, { status: 409 });
  }

  const result = resetDemoSessionRecord(body.sessionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  const response = NextResponse.json({
    session: result.row.session,
    overlayOps: result.row.overlay.ops.length
  });
  applyDemoCookies(response, result.row);
  return response;
}
