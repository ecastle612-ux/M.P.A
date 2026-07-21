import { NextResponse } from "next/server";
import { apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { endMasterAdminSession } from "../../../../../lib/master-admin/session";

export async function POST() {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    await endMasterAdminSession(access.user);
    return NextResponse.json(
      { ok: true, redirectTo: "/dashboard" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}
