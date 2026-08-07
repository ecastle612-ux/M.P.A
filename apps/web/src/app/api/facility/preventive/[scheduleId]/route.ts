import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import {
  getPmSchedule,
  listPmGenerationRuns,
  listPmScheduleTimeline
} from "../../../../../lib/facility/pm-service";

type Params = { params: Promise<{ scheduleId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.preventive:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { scheduleId } = await context.params;
  try {
    const schedule = await getPmSchedule(authz.supabase, authz.organizationId, scheduleId);
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    const [runs, timeline] = await Promise.all([
      listPmGenerationRuns(authz.supabase, authz.organizationId, scheduleId),
      listPmScheduleTimeline(authz.supabase, authz.organizationId, scheduleId)
    ]);
    return NextResponse.json({ schedule, runs, timeline });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load schedule" },
      { status: 400 }
    );
  }
}
