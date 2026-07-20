import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { apiInternalError } from "../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../lib/master-admin/access";
import { runMasterAdminSeed } from "../../../../lib/master-admin/seed";

export async function POST() {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const supabase = await createAuthServerClient();
    const result = await runMasterAdminSeed(supabase, access.organizationId, access.user.id);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
