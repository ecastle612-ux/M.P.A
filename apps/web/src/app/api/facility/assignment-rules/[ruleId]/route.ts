import { NextResponse } from "next/server";
import { updateAssignmentRuleInputSchema } from "@mpa/shared";
import { requireFacilityRoutingPermission } from "../../../../../lib/facility/authz";
import {
  archiveAssignmentRule,
  FacilityRoutingConflictError,
  listAssignmentEvaluations,
  listAssignmentRules,
  updateAssignmentRule
} from "../../../../../lib/facility/assignment-routing-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  const authz = await requireFacilityRoutingPermission();
  if ("error" in authz) return authz.error;
  const { ruleId } = await context.params;
  try {
    const rules = await listAssignmentRules(authz.supabase, authz.organizationId);
    const rule = rules.find((row) => row.id === ruleId);
    if (!rule) return NextResponse.json({ error: "Assignment rule not found" }, { status: 404 });
    const evaluations = await listAssignmentEvaluations(authz.supabase, authz.organizationId, {
      ruleId
    });
    return NextResponse.json({ rule, evaluations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load assignment rule" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  const authz = await requireFacilityRoutingPermission();
  if ("error" in authz) return authz.error;
  const { ruleId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = updateAssignmentRuleInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const rule = await updateAssignmentRule(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      ruleId,
      parsed.data
    );
    return NextResponse.json({ rule });
  } catch (error) {
    const status = error instanceof FacilityRoutingConflictError ? 409 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update assignment rule" },
      { status }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  const authz = await requireFacilityRoutingPermission();
  if ("error" in authz) return authz.error;
  const { ruleId } = await context.params;
  try {
    const result = await archiveAssignmentRule(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      ruleId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to archive assignment rule" },
      { status: 400 }
    );
  }
}
