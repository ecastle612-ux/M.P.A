import { NextResponse } from "next/server";
import { triageSafetyIncidentInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../../lib/facility/authz";
import { triageSafetyIncident } from "../../../../../../lib/facility/safety-service";

type Params = { params: Promise<{ incidentId: string }> };

export async function POST(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.safety:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const { incidentId: paramIncidentId } = await context.params;
    const json = await request.json();
    const body = triageSafetyIncidentInputSchema.parse({
      ...json,
      incidentId: paramIncidentId ?? json.incidentId
    });
    const incident = await triageSafetyIncident(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ incident });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to triage incident" },
      { status: 400 }
    );
  }
}
