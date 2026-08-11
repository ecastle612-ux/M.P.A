import { NextResponse } from "next/server";
import {
  assertDemoBoundary,
  defaultPersonaForProduct,
  isDemoPersona,
  parseDemoProduct
} from "@mpa/shared";
import { readDemoCookiePair } from "../../../../lib/demo/cookie";
import { applyDemoCookies } from "../../../../lib/demo/durable-state";
import { isDemoRuntimeEnabled } from "../../../../lib/demo/demo-runtime";
import {
  createDemoSessionRecord,
  resolveDemoSessionRecord
} from "../../../../lib/demo/session-store";

export async function GET(request: Request) {
  if (!isDemoRuntimeEnabled()) {
    return NextResponse.json({ error: "demo_disabled" }, { status: 404 });
  }
  const id = new URL(request.url).searchParams.get("id");
  const cookies = await readDemoCookiePair();
  const row = resolveDemoSessionRecord({
    sessionId: id ?? cookies.sessionId,
    stateToken: cookies.stateToken
  });
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const response = NextResponse.json({
    session: row.session,
    overlayOps: row.overlay.ops.length,
    isolation: { productionDbAccess: false }
  });
  applyDemoCookies(response, row);
  return response;
}

export async function POST(request: Request) {
  if (!isDemoRuntimeEnabled()) {
    return NextResponse.json({ error: "demo_disabled" }, { status: 404 });
  }

  // Creating a real org from demo is always blocked.
  const orgGuard = assertDemoBoundary("create_org");
  if (orgGuard.allowed) {
    return NextResponse.json({ error: "misconfigured_boundary" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    product?: string;
    persona?: string;
  };
  const product = parseDemoProduct(body.product);
  if (!product) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }
  const persona =
    body.persona && isDemoPersona(body.persona)
      ? body.persona
      : defaultPersonaForProduct(product);

  const row = createDemoSessionRecord({ product, persona });
  const response = NextResponse.json({ session: row.session });
  applyDemoCookies(response, row);
  return response;
}
