import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseVendorMutationInput } from "../../../../lib/vendor/contracts";
import {
  archiveVendor,
  getVendorForOrganization,
  restoreVendor,
  softDeleteVendor,
  updateVendor
} from "../../../../lib/vendor/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET(_: Request, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const { vendorId } = await params;
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
    if (!evaluatePermission(authorization, "vendor:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const vendor = await getVendorForOrganization(organizationId, vendorId, supabase);
    return vendor ? NextResponse.json({ vendor }) : apiError(404, "NOT_FOUND", "Not found");
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const { vendorId } = await params;
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

    const mutation = parseVendorMutationInput(parsedBody.payload);
    if (!mutation) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid vendor update payload");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (mutation.action === "archive") {
      if (!evaluatePermission(authorization, "vendor:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const vendor = await archiveVendor(organizationId, vendorId, user.id, supabase);
      return vendor ? NextResponse.json({ vendor }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "restore") {
      if (!evaluatePermission(authorization, "vendor:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const vendor = await restoreVendor(organizationId, vendorId, user.id, supabase);
      return vendor ? NextResponse.json({ vendor }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "soft_delete") {
      if (!evaluatePermission(authorization, "vendor:delete")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const vendor = await softDeleteVendor(organizationId, vendorId, user.id, supabase);
      return vendor ? NextResponse.json({ vendor }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (!evaluatePermission(authorization, "vendor:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }
    const vendor = await updateVendor(organizationId, vendorId, user.id, mutation.updates, supabase);
    return vendor ? NextResponse.json({ vendor }) : apiError(404, "NOT_FOUND", "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vendor update failed";
    return apiError(400, "VENDOR_UPDATE_FAILED", message);
  }
}
