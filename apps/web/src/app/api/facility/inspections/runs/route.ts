import { NextResponse } from "next/server";
import { startInspectionRunInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { startInspectionRun } from "../../../../../lib/facility/inspection-service";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.inspections:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = startInspectionRunInputSchema.parse(await request.json());
    const run = await startInspectionRun(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start inspection run" },
      { status: 400 }
    );
  }
}
