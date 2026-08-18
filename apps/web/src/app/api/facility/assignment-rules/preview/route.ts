import { NextResponse } from "next/server";
import { previewAssignmentRulesInputSchema } from "@mpa/shared";
import { requireFacilityRoutingPermission } from "../../../../../lib/facility/authz";
import {
  listAssignmentRules,
  previewAssignmentRules
} from "../../../../../lib/facility/assignment-routing-service";
import { listTechnicians } from "../../../../../lib/maintenance/maintenance-service";

export async function POST(request: Request) {
  const authz = await requireFacilityRoutingPermission();
  if ("error" in authz) return authz.error;
  const payload = await request.json().catch(() => null);
  const parsed = previewAssignmentRulesInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const [rules, technicians] = await Promise.all([
      listAssignmentRules(authz.supabase, authz.organizationId),
      listTechnicians(authz.supabase, authz.organizationId)
    ]);
    const preview = previewAssignmentRules(rules, parsed.data, "the matching staff member");
    const assignee = technicians.find((row) => row.userId === preview.assigneeUserId);
    return NextResponse.json({
      preview: {
        ...preview,
        assigneeLabel: assignee?.displayName ?? preview.assigneeUserId
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to preview assignment rules" },
      { status: 400 }
    );
  }
}
