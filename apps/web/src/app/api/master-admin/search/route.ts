import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { requireMasterAdminApiAccess } from "../../../../lib/master-admin/access";
import { searchMasterAdminEntities } from "../../../../lib/master-admin/search";
import { apiInternalError } from "../../../../lib/api/http";

export async function GET(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json({ results: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const supabase = await createAuthServerClient();
    const results = await searchMasterAdminEntities(supabase, access.organizationId, query);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
