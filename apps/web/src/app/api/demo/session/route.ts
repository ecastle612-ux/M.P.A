import { NextResponse } from "next/server";
import {
  COM_002_FLAGS,
  assertDemoBoundary,
  defaultPersonaForProduct,
  isDemoPersona,
  parseDemoProduct
} from "@mpa/shared";
import { demoSessionCookieOptions } from "../../../../lib/demo/cookie";
import {
  createDemoSessionRecord,
  getDemoSessionRecord
} from "../../../../lib/demo/session-store";

export async function GET(request: Request) {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    return NextResponse.json({ error: "demo_disabled" }, { status: 404 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  const row = getDemoSessionRecord(id);
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    session: row.session,
    overlayOps: row.overlay.ops.length,
    isolation: { productionDbAccess: false }
  });
}

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
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
  const cookie = demoSessionCookieOptions();
  response.cookies.set(cookie.name, row.session.id, cookie);
  return response;
}
