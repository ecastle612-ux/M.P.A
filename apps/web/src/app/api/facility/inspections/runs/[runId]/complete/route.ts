import { NextResponse } from "next/server";
import { completeInspectionRunInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../../../lib/facility/authz";
import { completeInspectionRun } from "../../../../../../../lib/facility/inspection-service";

type Params = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.inspections:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const { runId: paramRunId } = await context.params;
    const json = await request.json();
    const body = completeInspectionRunInputSchema.parse({
      ...json,
      runId: paramRunId ?? json.runId
    });
    const run = await completeInspectionRun(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete inspection run" },
      { status: 400 }
    );
  }
}
