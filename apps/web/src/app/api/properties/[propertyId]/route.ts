import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import {
  archiveProperty,
  getPropertyForOrganization,
  restoreProperty,
  softDeleteProperty,
  updateProperty
} from "../../../../lib/property/server";
import { parsePropertyMutationInput } from "../../../../lib/property/contracts";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET(_: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  try {
    const { propertyId } = await params;
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
    if (!evaluatePermission(authorization, "property:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const property = await getPropertyForOrganization(organizationId, propertyId, supabase);
    if (!property) {
      return apiError(404, "NOT_FOUND", "Not found");
    }
    return NextResponse.json({ property });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  try {
    const { propertyId } = await params;
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
    const mutation = parsePropertyMutationInput(parsedBody.payload);
    if (!mutation) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid property update payload");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (mutation.action === "archive") {
      if (!evaluatePermission(authorization, "property:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const property = await archiveProperty(organizationId, propertyId, user.id, supabase);
      return property
        ? NextResponse.json({ property })
        : apiError(404, "NOT_FOUND", "Not found");
    }
    if (mutation.action === "restore") {
      if (!evaluatePermission(authorization, "property:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const property = await restoreProperty(organizationId, propertyId, user.id, supabase);
      return property
        ? NextResponse.json({ property })
        : apiError(404, "NOT_FOUND", "Not found");
    }
    if (mutation.action === "soft_delete") {
      if (!evaluatePermission(authorization, "property:delete")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const property = await softDeleteProperty(organizationId, propertyId, user.id, supabase);
      return property
        ? NextResponse.json({ property })
        : apiError(404, "NOT_FOUND", "Not found");
    }

    if (!evaluatePermission(authorization, "property:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }
    const property = await updateProperty(organizationId, propertyId, user.id, mutation.updates, supabase);
    return property ? NextResponse.json({ property }) : apiError(404, "NOT_FOUND", "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Property update failed";
    return apiError(400, "PROPERTY_UPDATE_FAILED", message);
  }
}
