import { NextResponse } from "next/server";
import { COM_002_FLAGS, isDemoPersona, personasForDemoProduct } from "@mpa/shared";
import { readDemoCookiePair } from "../../../../lib/demo/cookie";
import { applyDemoCookies } from "../../../../lib/demo/durable-state";
import {
  resolveDemoSessionRecord,
  switchDemoPersona
} from "../../../../lib/demo/session-store";

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

  const cookies = await readDemoCookiePair();
  const current = resolveDemoSessionRecord({
    sessionId: body.sessionId,
    stateToken: cookies.stateToken
  });
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
  const response = NextResponse.json({ session: next.session });
  applyDemoCookies(response, next);
  return response;
}
