import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { listPrivilegedAuditForOrganization } from "../../../../../lib/auth/recovery/privileged-audit";

export async function GET(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const organizationId = new URL(request.url).searchParams.get("organizationId")?.trim();
    if (!organizationId) {
      return apiError(400, "INVALID_INPUT", "organizationId is required");
    }

    const records = await listPrivilegedAuditForOrganization(organizationId);
    return NextResponse.json({ ok: true, records }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
