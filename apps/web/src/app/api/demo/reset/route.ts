import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { resetDemoSessionRecord } from "../../../../lib/demo/session-store";

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    return NextResponse.json({ error: "demo_disabled" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (!body.sessionId) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }
  const result = resetDemoSessionRecord(body.sessionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }
  return NextResponse.json({
    session: result.row.session,
    overlayOps: result.row.overlay.ops.length
  });
}
