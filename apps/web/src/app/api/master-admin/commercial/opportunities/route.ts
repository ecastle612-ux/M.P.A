import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import type { SaasPlanCode } from "../../../../../lib/integrations/saas-billing/contracts";
import {
  createOpportunity,
  listOpportunities,
  transitionOpportunityStage,
  updateOpportunity
} from "../../../../../lib/commercial/opportunities";
import {
  COMMERCIAL_PIPELINE_STAGES,
  isCommercialPipelineStage,
  type ImplementationPreference
} from "../../../../../lib/commercial/types";

const PLAN_CODES: SaasPlanCode[] = ["trial", "founder", "professional", "business", "enterprise"];

/**
 * COM-001 Slice A — ops-minimum opportunity list/create.
 */
export async function GET(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const stageRaw = url.searchParams.get("stage");
    const stage =
      stageRaw && isCommercialPipelineStage(stageRaw) ? stageRaw : undefined;
    const rows = await listOpportunities({ stage, limit: 100 });
    return NextResponse.json(
      { ok: true, opportunities: rows, stages: COMMERCIAL_PIPELINE_STAGES },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "create";

    if (action === "transition") {
      const opportunityId =
        typeof body["opportunityId"] === "string" ? body["opportunityId"].trim() : "";
      const toStage = typeof body["toStage"] === "string" ? body["toStage"] : "";
      if (!opportunityId || !isCommercialPipelineStage(toStage)) {
        return apiError(400, "INVALID_INPUT", "opportunityId and valid toStage are required");
      }
      const opportunity = await transitionOpportunityStage({
        opportunityId,
        toStage,
        lostReason: typeof body["lostReason"] === "string" ? body["lostReason"] : null,
        actorUserId: access.user.id
      });
      return NextResponse.json(
        { ok: true, opportunity },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "update") {
      const opportunityId =
        typeof body["opportunityId"] === "string" ? body["opportunityId"].trim() : "";
      if (!opportunityId) return apiError(400, "INVALID_INPUT", "opportunityId is required");
      const planRaw = typeof body["planCode"] === "string" ? body["planCode"] : null;
      const planCode =
        planRaw && PLAN_CODES.includes(planRaw as SaasPlanCode)
          ? (planRaw as SaasPlanCode)
          : undefined;
      const impl =
        body["implementationPreference"] === "professional" ||
        body["implementationPreference"] === "ai_guided"
          ? (body["implementationPreference"] as ImplementationPreference)
          : undefined;
      const opportunity = await updateOpportunity(opportunityId, {
        ...(typeof body["companyName"] === "string"
          ? { companyName: body["companyName"] }
          : {}),
        ...(typeof body["contactEmail"] === "string"
          ? { contactEmail: body["contactEmail"] }
          : {}),
        ...(typeof body["contactName"] === "string" || body["contactName"] === null
          ? { contactName: (body["contactName"] as string | null) ?? null }
          : {}),
        ...(typeof body["source"] === "string" ? { source: body["source"] } : {}),
        ...(typeof body["salesOwnerId"] === "string" || body["salesOwnerId"] === null
          ? { salesOwnerId: (body["salesOwnerId"] as string | null) ?? null }
          : {}),
        ...(typeof body["expectedClose"] === "string" || body["expectedClose"] === null
          ? { expectedClose: (body["expectedClose"] as string | null) ?? null }
          : {}),
        ...(typeof body["probability"] === "number" ? { probability: body["probability"] } : {}),
        ...(typeof body["acquisitionCostCents"] === "number" ||
        body["acquisitionCostCents"] === null
          ? { acquisitionCostCents: (body["acquisitionCostCents"] as number | null) ?? null }
          : {}),
        ...(typeof body["referralSource"] === "string" || body["referralSource"] === null
          ? { referralSource: (body["referralSource"] as string | null) ?? null }
          : {}),
        ...(planCode !== undefined ? { planCode } : {}),
        ...(impl !== undefined ? { implementationPreference: impl } : {}),
        ...(typeof body["notes"] === "string" || body["notes"] === null
          ? { notes: (body["notes"] as string | null) ?? null }
          : {})
      });
      return NextResponse.json(
        { ok: true, opportunity },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const companyName = typeof body["companyName"] === "string" ? body["companyName"].trim() : "";
    const contactEmail =
      typeof body["contactEmail"] === "string" ? body["contactEmail"].trim().toLowerCase() : "";
    if (!companyName || !contactEmail) {
      return apiError(400, "INVALID_INPUT", "companyName and contactEmail are required");
    }

    const planRaw = typeof body["planCode"] === "string" ? body["planCode"] : null;
    const planCode =
      planRaw && PLAN_CODES.includes(planRaw as SaasPlanCode)
        ? (planRaw as SaasPlanCode)
        : null;
    const impl =
      body["implementationPreference"] === "professional" ||
      body["implementationPreference"] === "ai_guided"
        ? (body["implementationPreference"] as ImplementationPreference)
        : null;

    const opportunity = await createOpportunity({
      companyName,
      contactEmail,
      contactName: typeof body["contactName"] === "string" ? body["contactName"] : null,
      source: typeof body["source"] === "string" ? body["source"] : "manual",
      salesOwnerId:
        typeof body["salesOwnerId"] === "string" ? body["salesOwnerId"] : access.user.id,
      expectedClose: typeof body["expectedClose"] === "string" ? body["expectedClose"] : null,
      probability: typeof body["probability"] === "number" ? body["probability"] : null,
      acquisitionCostCents:
        typeof body["acquisitionCostCents"] === "number" ? body["acquisitionCostCents"] : null,
      referralSource: typeof body["referralSource"] === "string" ? body["referralSource"] : null,
      planCode,
      organizationType:
        typeof body["organizationType"] === "string"
          ? body["organizationType"]
          : "property_manager",
      implementationPreference: impl,
      notes: typeof body["notes"] === "string" ? body["notes"] : null,
      actorUserId: access.user.id
    });

    return NextResponse.json(
      { ok: true, opportunity },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Opportunity request failed";
    if (
      message.includes("required") ||
      message.includes("Invalid") ||
      message.includes("Cannot") ||
      message.includes("Lost Reason")
    ) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
