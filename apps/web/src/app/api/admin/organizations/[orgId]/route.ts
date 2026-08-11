import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { loadMa2OrganizationDetail } from "../../../../../lib/admin/load-ma2-org-detail";

/**
 * MA-2 — inspect-only Organization Detail API.
 * Auth: authenticated platform operator. Org id from path only (server-validated).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string }> | { orgId: string } }
) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orgId } = await Promise.resolve(context.params);
  if (!orgId || typeof orgId !== "string") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const detail = await loadMa2OrganizationDetail(orgId);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Never return raw secrets; snapshot already scrubbed.
  return NextResponse.json(
    { organization: detail },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
