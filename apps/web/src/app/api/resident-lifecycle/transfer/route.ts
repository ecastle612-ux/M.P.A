import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, parseJsonBody } from "../../../../lib/api/http";
import { parseTransferUnitInput } from "../../../../lib/resident-lifecycle/contracts";
import { transferResidentUnit } from "../../../../lib/resident-lifecycle/server";

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "tenant:update") && !evaluatePermission(authorization, "lease:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseTransferUnitInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid transfer payload");

    const result = await transferResidentUnit(
      organizationId,
      user.id,
      input,
      { canOverrideOccupied: evaluatePermission(authorization, "lease:update") },
      supabase
    );

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    return apiError(400, "TRANSFER_FAILED", message);
  }
}
