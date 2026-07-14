import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseTenantMutationInput } from "../../../../lib/tenant/contracts";
import {
  archiveTenant,
  getTenantForOrganization,
  restoreTenant,
  softDeleteTenant,
  updateTenant
} from "../../../../lib/tenant/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET(_: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "tenant:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const tenant = await getTenantForOrganization(organizationId, tenantId, supabase);
    return tenant ? NextResponse.json({ tenant }) : apiError(404, "NOT_FOUND", "Not found");
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const mutation = parseTenantMutationInput(parsedBody.payload);
    if (!mutation) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid tenant update payload");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (mutation.action === "archive") {
      if (!evaluatePermission(authorization, "tenant:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const tenant = await archiveTenant(organizationId, tenantId, user.id, supabase);
      return tenant ? NextResponse.json({ tenant }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "restore") {
      if (!evaluatePermission(authorization, "tenant:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const tenant = await restoreTenant(organizationId, tenantId, user.id, supabase);
      return tenant ? NextResponse.json({ tenant }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "soft_delete") {
      if (!evaluatePermission(authorization, "tenant:delete")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const tenant = await softDeleteTenant(organizationId, tenantId, user.id, supabase);
      return tenant ? NextResponse.json({ tenant }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (!evaluatePermission(authorization, "tenant:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }
    const tenant = await updateTenant(organizationId, tenantId, user.id, mutation.updates, supabase);
    return tenant ? NextResponse.json({ tenant }) : apiError(404, "NOT_FOUND", "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tenant update failed";
    return apiError(400, "TENANT_UPDATE_FAILED", message);
  }
}
