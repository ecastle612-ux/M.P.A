import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { resolveOwnerPropertyScope } from "../../../../../lib/owner-portal/access";
import {
  listOwnerPayoutHistory,
  listOwnerRemittanceRecords
} from "../../../../../lib/owner-payouts/projections";

/** GET — owner-scoped TransferIntent history + remittance records (FIN-003 Phase D). */
export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const scope = await resolveOwnerPropertyScope({
      organizationId,
      user,
      supabase
    });

    const [history, remittances] = await Promise.all([
      listOwnerPayoutHistory({
        organizationId,
        ownerUserId: user.id,
        propertyIds: scope.propertyIds,
        client: supabase
      }),
      listOwnerRemittanceRecords({
        organizationId,
        ownerUserId: user.id,
        propertyIds: scope.propertyIds,
        client: supabase
      })
    ]);

    return NextResponse.json(
      { history, remittances },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}
