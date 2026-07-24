import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import {
  listAllocationProfiles,
  upsertAllocationProfiles
} from "../../../../../lib/owner-payouts/transfers";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (
      !evaluatePermission(authorization, "payout:manage") &&
      !evaluatePermission(authorization, "financial:read")
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const propertyId = new URL(request.url).searchParams.get("propertyId");
    if (!propertyId) return apiError(400, "MISSING_PROPERTY", "propertyId required");

    const profiles = await listAllocationProfiles({
      organizationId,
      propertyId,
      client: supabase
    });
    return NextResponse.json({ profiles }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (message.includes("sum to 100") || message.includes("percent")) {
      return apiError(400, "INVALID_PROFILE", message);
    }
    return apiInternalError();
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "payout:manage")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = (await request.json()) as {
      propertyId?: string;
      shares?: Array<{ ownerUserId: string; percent: number }>;
    };
    if (!body.propertyId || !Array.isArray(body.shares)) {
      return apiError(400, "INVALID_BODY", "propertyId and shares required");
    }

    const profiles = await upsertAllocationProfiles({
      organizationId,
      propertyId: body.propertyId,
      shares: body.shares,
      actorUserId: user.id,
      client: supabase
    });
    return NextResponse.json({ profiles }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (message.includes("sum to 100") || message.includes("percent") || message.includes("empty")) {
      return apiError(400, "INVALID_PROFILE", message);
    }
    return apiInternalError();
  }
}
