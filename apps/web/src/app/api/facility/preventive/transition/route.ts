import { NextResponse } from "next/server";
import { transitionPmScheduleInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { transitionPmSchedule } from "../../../../../lib/facility/pm-service";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.preventive:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const input = transitionPmScheduleInputSchema.parse(await request.json());
    const schedule = await transitionPmSchedule(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      input
    );
    return NextResponse.json({ schedule });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transition schedule" },
      { status: 400 }
    );
  }
}
