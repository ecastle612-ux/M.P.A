import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { parseCreateLeaseInput } from "../../../lib/lease/contracts";
import { createLease, getLeasesForOrganization, type LeaseListOptions } from "../../../lib/lease/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../lib/api/http";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "lease:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const statusRaw = url.searchParams.get("status");
    const renewalStatusRaw = url.searchParams.get("renewalStatus");
    const options: LeaseListOptions = { ...pagination };
    if (statusRaw === "draft" || statusRaw === "signed" || statusRaw === "active" || statusRaw === "expired" || statusRaw === "terminated" || statusRaw === "all") {
      options.status = statusRaw;
    }
    if (
      renewalStatusRaw === "none" ||
      renewalStatusRaw === "offered" ||
      renewalStatusRaw === "pending" ||
      renewalStatusRaw === "renewed" ||
      renewalStatusRaw === "declined" ||
      renewalStatusRaw === "notice_given" ||
      renewalStatusRaw === "all"
    ) {
      options.renewalStatus = renewalStatusRaw;
    }
    const search = url.searchParams.get("search");
    if (search?.trim()) options.search = search;
    const propertyId = url.searchParams.get("propertyId");
    if (propertyId) options.propertyId = propertyId;
    const unitId = url.searchParams.get("unitId");
    if (unitId) options.unitId = unitId;
    const tenantId = url.searchParams.get("tenantId");
    if (tenantId) options.tenantId = tenantId;
    const expiringWithinDays = url.searchParams.get("expiringWithinDays");
    if (expiringWithinDays) options.expiringWithinDays = Number(expiringWithinDays);

    const items = await getLeasesForOrganization(organizationId, options, supabase);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

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
    if (!evaluatePermission(authorization, "lease:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreateLeaseInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid lease payload");

    const lease = await createLease(organizationId, user.id, input, supabase);
    return NextResponse.json({ lease }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lease creation failed";
    return apiError(400, "LEASE_CREATE_FAILED", message);
  }
}
