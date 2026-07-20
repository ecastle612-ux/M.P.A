import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { createUnitsBulk } from "../../../../lib/unit/server";
import {
  buildBulkUnitPreview,
  parseBulkUnitGeneratorInput,
  type CreateUnitInput
} from "../../../../lib/unit/contracts";
import { apiError, parseJsonBody } from "../../../../lib/api/http";

export async function POST(request: Request) {
  try {
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
    if (!evaluatePermission(authorization, "unit:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const body = parsedBody.payload as Record<string, unknown>;
    const previewOnly = body["preview"] === true;
    const generator = parseBulkUnitGeneratorInput(body);
    if (!generator) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid bulk unit payload");
    }

    const { items, errors } = buildBulkUnitPreview(generator);
    if (errors.length > 0) {
      return apiError(400, "VALIDATION_FAILED", errors.join(" "));
    }

    if (previewOnly) {
      return NextResponse.json({ items, count: items.length }, { headers: { "Cache-Control": "no-store" } });
    }

    const inputs: CreateUnitInput[] = items.map((item) => ({
      propertyId: generator.propertyId,
      unitNumber: item.unitNumber,
      unitLabel: null,
      bedrooms: generator.bedrooms,
      bathrooms: generator.bathrooms,
      squareFeet: generator.squareFeet,
      floor: item.floor,
      rentAmount: generator.rentAmount,
      depositAmount: generator.depositAmount,
      currencyCode: generator.currencyCode,
      occupancyStatus: generator.occupancyStatus,
      status: generator.status,
      metadata: { source: "bulk_generator" }
    }));

    const units = await createUnitsBulk(organizationId, user.id, inputs, supabase);
    return NextResponse.json({ units, count: units.length }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk unit creation failed";
    if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("unique")) {
      return apiError(409, "UNIT_CONFLICT", "One or more unit numbers already exist for this property.");
    }
    return apiError(400, "BULK_UNIT_CREATE_FAILED", message);
  }
}
