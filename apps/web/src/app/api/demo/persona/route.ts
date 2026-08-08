import { NextResponse } from "next/server";
import { COM_002_FLAGS, isDemoPersona, personasForDemoProduct } from "@mpa/shared";
import { getDemoSessionRecord, switchDemoPersona } from "../../../../lib/demo/session-store";

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    return NextResponse.json({ error: "demo_disabled" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
    persona?: string;
  };
  if (!body.sessionId || !body.persona || !isDemoPersona(body.persona)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const current = getDemoSessionRecord(body.sessionId);
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!personasForDemoProduct(current.session.product).includes(body.persona)) {
    return NextResponse.json({ error: "persona_not_allowed" }, { status: 400 });
  }
  const next = switchDemoPersona(body.sessionId, body.persona);
  if (!next) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ session: next.session });
}
