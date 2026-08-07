import { NextResponse } from "next/server";
import { createSafetyIncidentInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import {
  buildSafetyAssistant,
  createSafetyIncident,
  listSafetyIncidents,
  summarizeSafety
} from "../../../../lib/facility/safety-service";
import { listFacilitySites } from "../../../../lib/facility/site-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.safety:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const [incidents, sites] = await Promise.all([
      listSafetyIncidents(authz.supabase, authz.organizationId),
      listFacilitySites(authz.supabase, authz.organizationId)
    ]);
    const summary = summarizeSafety(incidents);
    return NextResponse.json({
      incidents,
      summary,
      assistantRecommendation: buildSafetyAssistant(summary),
      sites: sites.filter((site) => site.status === "active")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load safety incidents" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.safety:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = createSafetyIncidentInputSchema.parse(await request.json());
    const incident = await createSafetyIncident(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to report safety incident" },
      { status: 400 }
    );
  }
}
