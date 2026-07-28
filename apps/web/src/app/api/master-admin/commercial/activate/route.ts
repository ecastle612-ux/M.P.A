import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import type { SaasPlanCode } from "../../../../../lib/integrations/saas-billing/contracts";
import { activateOpportunityFromPayment } from "../../../../../lib/commercial/activation";
import type { ImplementationPreference } from "../../../../../lib/commercial/types";

const PLAN_CODES: SaasPlanCode[] = ["trial", "founder", "professional", "business", "enterprise"];

/**
 * COM-001 Slice A — Master Admin commercial exception activation (CA-07).
 * Still runs AUTH-001 provision and emits commercial activation trail.
 * Does not create orgs from Won alone — this is the audited activation path.
 */
export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json()) as Record<string, unknown>;
    const idempotencyKey =
      typeof body["idempotencyKey"] === "string" ? body["idempotencyKey"].trim() : "";
    const buyerCompanyName =
      typeof body["buyerCompanyName"] === "string" ? body["buyerCompanyName"].trim() : "";
    const buyerContactEmail =
      typeof body["buyerContactEmail"] === "string"
        ? body["buyerContactEmail"].trim().toLowerCase()
        : "";
    const planRaw = typeof body["planCode"] === "string" ? body["planCode"] : "professional";
    const planCode = PLAN_CODES.includes(planRaw as SaasPlanCode)
      ? (planRaw as SaasPlanCode)
      : null;

    if (!idempotencyKey || !buyerCompanyName || !buyerContactEmail || !planCode) {
      return apiError(
        400,
        "INVALID_INPUT",
        "idempotencyKey, buyerCompanyName, buyerContactEmail, and planCode are required"
      );
    }

    const impl =
      body["implementationPreference"] === "professional" ||
      body["implementationPreference"] === "ai_guided"
        ? (body["implementationPreference"] as ImplementationPreference)
        : null;

    const result = await activateOpportunityFromPayment({
      idempotencyKey: `level0:${idempotencyKey}`,
      planCode,
      buyerCompanyName,
      buyerContactEmail,
      buyerLegalName:
        typeof body["buyerLegalName"] === "string" ? body["buyerLegalName"].trim() : null,
      organizationType:
        typeof body["organizationType"] === "string"
          ? body["organizationType"].trim()
          : "property_manager",
      opportunityId:
        typeof body["opportunityId"] === "string" ? body["opportunityId"].trim() : null,
      salesOwnerId:
        typeof body["salesOwnerId"] === "string" ? body["salesOwnerId"].trim() : access.user.id,
      implementationPreference: impl,
      actorUserId: access.user.id,
      correlationId: access.user.id,
      masterAdminException: true
    });

    return NextResponse.json(
      {
        ok: true,
        organizationId: result.organizationId,
        opportunityId: result.opportunity.id,
        orgAdminUsername: result.orgAdminUsername,
        planCode: result.planCode,
        commercialStatus: result.commercialStatus,
        idempotentReplay: result.idempotentReplay,
        activationRequestId: result.activationRequestId,
        stage: result.opportunity.stage
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Activation failed";
    if (message.includes("required") || message.includes("Valid contact")) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
