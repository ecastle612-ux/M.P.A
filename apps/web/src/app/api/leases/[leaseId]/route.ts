import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseLeaseMutationInput } from "../../../../lib/lease/contracts";
import { applyLeaseMutation, getLeaseForOrganization } from "../../../../lib/lease/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET(_: Request, { params }: { params: Promise<{ leaseId: string }> }) {
  try {
    const { leaseId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "lease:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const lease = await getLeaseForOrganization(organizationId, leaseId, supabase);
    return lease ? NextResponse.json({ lease }) : apiError(404, "NOT_FOUND", "Not found");
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ leaseId: string }> }) {
  try {
    const { leaseId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const mutation = parseLeaseMutationInput(parsedBody.payload);
    if (!mutation) return apiError(400, "INVALID_PAYLOAD", "Invalid lease update payload");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (mutation.action === "archive" || mutation.action === "restore") {
      if (!evaluatePermission(authorization, "lease:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
    } else if (mutation.action === "soft_delete") {
      if (!evaluatePermission(authorization, "lease:delete")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
    } else if (!evaluatePermission(authorization, "lease:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const lease = await applyLeaseMutation(organizationId, leaseId, user.id, mutation, supabase);
    return lease ? NextResponse.json({ lease }) : apiError(404, "NOT_FOUND", "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lease update failed";
    return apiError(400, "LEASE_UPDATE_FAILED", message);
  }
}
