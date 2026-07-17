import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseCreatePaymentInput } from "../../../../lib/financial/contracts";
import { getPaymentsForOrganization, recordPayment, type PaymentListOptions } from "../../../../lib/financial/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../../lib/api/http";

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
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const options: PaymentListOptions = { ...pagination };

    const statusRaw = url.searchParams.get("status");
    if (
      statusRaw === "pending" ||
      statusRaw === "completed" ||
      statusRaw === "failed" ||
      statusRaw === "refunded" ||
      statusRaw === "all"
    ) {
      options.status = statusRaw;
    }

    const search = url.searchParams.get("search");
    if (search?.trim()) options.search = search;

    const propertyId = url.searchParams.get("propertyId");
    if (propertyId) options.propertyId = propertyId;

    const leaseId = url.searchParams.get("leaseId");
    if (leaseId) options.leaseId = leaseId;

    const tenantId = url.searchParams.get("tenantId");
    if (tenantId) options.tenantId = tenantId;

    const items = await getPaymentsForOrganization(organizationId, options, supabase);
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
    if (!evaluatePermission(authorization, "financial:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreatePaymentInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid payment payload");

    const payment = await recordPayment(organizationId, user.id, input, supabase);
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment recording failed";
    return apiError(400, "PAYMENT_RECORD_FAILED", message);
  }
}
