import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../lib/master-admin/access";
import {
  PORTAL_TEST_HREFS,
  type MasterAdminPortal
} from "../../../../lib/master-admin/contracts";
import { startPortalTestSession } from "../../../../lib/master-admin/session";

const PORTALS: MasterAdminPortal[] = ["resident", "vendor", "owner", "manager"];

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => null)) as {
      portal?: string;
      reason?: string;
    } | null;
    const portal = body?.portal;
    if (!portal || !PORTALS.includes(portal as MasterAdminPortal)) {
      return apiError(400, "INVALID_PORTAL", "portal must be resident, vendor, owner, or manager.");
    }

    const session = await startPortalTestSession({
      user: access.user,
      organizationId: access.organizationId,
      portal: portal as MasterAdminPortal,
      reason: body?.reason ?? null
    });

    return NextResponse.json(
      {
        session,
        redirectTo: PORTAL_TEST_HREFS[portal as MasterAdminPortal]
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start portal test.";
    if (message.includes("Master Admin")) {
      return apiError(403, "FORBIDDEN", message);
    }
    return apiInternalError();
  }
}
