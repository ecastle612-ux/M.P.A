import { NextResponse } from "next/server";
import { createAssignmentRuleInputSchema } from "@mpa/shared";
import { requireFacilityRoutingPermission } from "../../../../lib/facility/authz";
import {
  createAssignmentRule,
  FacilityRoutingConflictError,
  listAssignmentEvaluations,
  loadAssignmentRulesCatalog
} from "../../../../lib/facility/assignment-routing-service";

export async function GET(request: Request) {
  const authz = await requireFacilityRoutingPermission();
  if ("error" in authz) return authz.error;
  const url = new URL(request.url);
  try {
    const catalog = await loadAssignmentRulesCatalog(authz.supabase, authz.organizationId);
    const evaluations = await listAssignmentEvaluations(authz.supabase, authz.organizationId, {
      ...(url.searchParams.get("ruleId") ? { ruleId: url.searchParams.get("ruleId") ?? "" } : {}),
      ...(url.searchParams.get("workOrderId")
        ? { workOrderId: url.searchParams.get("workOrderId") ?? "" }
        : {})
    });
    return NextResponse.json({ ...catalog, evaluations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load assignment rules" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityRoutingPermission();
  if ("error" in authz) return authz.error;
  const payload = await request.json().catch(() => null);
  const parsed = createAssignmentRuleInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const rule = await createAssignmentRule(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    const status = error instanceof FacilityRoutingConflictError ? 409 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create assignment rule" },
      { status }
    );
  }
}
