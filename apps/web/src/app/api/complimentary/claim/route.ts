import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../lib/organization/contracts";
import {
  claimComplimentaryAccess,
  complimentaryPreviewFromToken
} from "../../../../lib/complimentary-access/service";
import {
  createRuntimeComplimentaryDeps,
  loadRuntimeComplimentaryStore,
  persistRuntimeComplimentaryState
} from "../../../../lib/complimentary-access/runtime";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const store = await loadRuntimeComplimentaryStore();
  const preview = complimentaryPreviewFromToken(token, { store });
  if (!preview) {
    return NextResponse.json({ error: "invalid_or_expired_claim_token" }, { status: 401 });
  }
  return NextResponse.json(preview);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: string;
    password?: string;
    productSku?: string;
  } | null;
  const token = body?.token?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "bind_token_required" }, { status: 400 });
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const store = await loadRuntimeComplimentaryStore();
  const deps = await createRuntimeComplimentaryDeps(store);
  try {
    const result = await claimComplimentaryAccess(
      {
        token,
        actorEmail: user?.email ?? null,
        ...(body?.password ? { password: body.password } : {}),
        ...(body?.productSku !== undefined ? { requestedSku: body.productSku } : {})
      },
      deps
    );
    if (!result.ok) {
      const status =
        result.error === "claim_cannot_change_sku" || result.error === "email_mismatch" ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    await persistRuntimeComplimentaryState(store);
    const response = NextResponse.json({
      ok: true,
      organizationId: result.organizationId,
      userId: result.userId,
      productSku: result.grant.productSku,
      reusedUser: result.reusedUser,
      reusedOrganization: result.reusedOrganization,
      nextPath: "/setup"
    });
    response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, result.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "claim_failed" },
      { status: 502 }
    );
  }
}
