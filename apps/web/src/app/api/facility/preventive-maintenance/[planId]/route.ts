import { NextResponse } from "next/server";
import { updatePmPlanInputSchema } from "@mpa/shared";
import { requireFacilityPreventivePermission } from "../../../../../lib/facility/authz";
import {
  FacilityPmConflictError,
  getPmPlan,
  listPmOccurrences,
  updatePmPlan
} from "../../../../../lib/facility/pm-plan-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ planId: string }> }
) {
  const authz = await requireFacilityPreventivePermission();
  if ("error" in authz) return authz.error;
  const { planId } = await context.params;
  try {
    const plan = await getPmPlan(authz.supabase, authz.organizationId, planId);
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    const occurrences = await listPmOccurrences(authz.supabase, authz.organizationId, planId);
    return NextResponse.json({ plan, occurrences });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load plan" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ planId: string }> }
) {
  const authz = await requireFacilityPreventivePermission();
  if ("error" in authz) return authz.error;
  const { planId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = updatePmPlanInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const plan = await updatePmPlan(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      planId,
      parsed.data
    );
    return NextResponse.json({ plan });
  } catch (error) {
    const status = error instanceof FacilityPmConflictError ? 409 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update plan" },
      { status }
    );
  }
}
