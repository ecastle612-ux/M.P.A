import { NextResponse } from "next/server";
import { createPmScheduleInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import {
  buildPmAssistantRecommendation,
  createPmSchedule,
  listPmGenerationRuns,
  listPmSchedules,
  summarizePmSchedules
} from "../../../../lib/facility/pm-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.preventive:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const [schedules, runs] = await Promise.all([
      listPmSchedules(authz.supabase, authz.organizationId),
      listPmGenerationRuns(authz.supabase, authz.organizationId)
    ]);
    const summary = summarizePmSchedules(schedules);
    return NextResponse.json({
      schedules,
      runs,
      summary,
      assistantRecommendation: buildPmAssistantRecommendation(summary)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load preventive maintenance" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.preventive:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = createPmScheduleInputSchema.parse(await request.json());
    const schedule = await createPmSchedule(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create PM schedule" },
      { status: 400 }
    );
  }
}
