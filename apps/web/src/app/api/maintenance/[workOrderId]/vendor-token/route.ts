import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import {
  getActiveVendorTokenForWorkOrder,
  mintVendorWorkOrderToken
} from "../../../../../lib/vendor-jobs/server";

export async function GET(_request: Request, { params }: { params: Promise<{ workOrderId: string }> }) {
  try {
    const { workOrderId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const active = await getActiveVendorTokenForWorkOrder(organizationId, workOrderId, supabase);
    return NextResponse.json({
      active: active
        ? {
            tokenId: active.tokenId,
            prefix: active.prefix,
            createdAt: active.createdAt,
            // Raw token is not stored; regenerate to obtain a shareable URL again.
            hasActiveToken: true
          }
        : null
    });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ workOrderId: string }> }) {
  try {
    const { workOrderId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    // Optional rotate flag — default always mints a fresh token (revokes prior).
    void request;

    const minted = await mintVendorWorkOrderToken(organizationId, workOrderId, user.id, supabase);
    const origin = new URL(request.url).origin;
    const absoluteUrl = `${origin}${minted.urlPath}`;

    return NextResponse.json({
      tokenId: minted.tokenId,
      prefix: minted.prefix,
      urlPath: minted.urlPath,
      url: absoluteUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mint vendor link";
    if (message.includes("not found")) {
      return apiError(404, "NOT_FOUND", message);
    }
    return apiInternalError();
  }
}
