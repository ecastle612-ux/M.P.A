import { NextResponse } from "next/server";
import { createInspectionProgramInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import { listFacilityAssets } from "../../../../lib/facility/asset-service";
import {
  buildInspectionAssistant,
  createInspectionProgram,
  listInspectionPrograms,
  listInspectionRuns,
  summarizeInspections
} from "../../../../lib/facility/inspection-service";
import { listFacilitySites } from "../../../../lib/facility/site-service";
import { listFacilitySystems } from "../../../../lib/facility/system-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.inspections:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const [programs, runs, sites, assets, systems] = await Promise.all([
      listInspectionPrograms(authz.supabase, authz.organizationId),
      listInspectionRuns(authz.supabase, authz.organizationId, { limit: 80 }),
      listFacilitySites(authz.supabase, authz.organizationId),
      listFacilityAssets(authz.supabase, authz.organizationId),
      listFacilitySystems(authz.supabase, authz.organizationId)
    ]);
    const summary = summarizeInspections(programs, runs);
    return NextResponse.json({
      programs,
      runs,
      summary,
      assistantRecommendation: buildInspectionAssistant(summary),
      sites: sites.filter((site) => site.status === "active"),
      assets,
      systems
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load inspections" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.inspections:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = createInspectionProgramInputSchema.parse(await request.json());
    const program = await createInspectionProgram(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create inspection program" },
      { status: 400 }
    );
  }
}
