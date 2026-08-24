import { NextResponse } from "next/server";
import { reorderAssignmentRulesInputSchema } from "@mpa/shared";
import { requireFacilityRoutingPermission } from "../../../../../lib/facility/authz";
import {
  FacilityRoutingConflictError,
  reorderAssignmentRules
} from "../../../../../lib/facility/assignment-routing-service";

export async function POST(request: Request) {
  const authz = await requireFacilityRoutingPermission();
  if ("error" in authz) return authz.error;
  const payload = await request.json().catch(() => null);
  const parsed = reorderAssignmentRulesInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const rules = await reorderAssignmentRules(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data.orderedIds
    );
    return NextResponse.json({ rules });
  } catch (error) {
    const status = error instanceof FacilityRoutingConflictError ? 409 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reorder assignment rules" },
      { status }
    );
  }
}
