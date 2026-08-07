import { NextResponse } from "next/server";
import { createComplianceObligationInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import {
  buildComplianceAssistant,
  createComplianceObligation,
  listComplianceObligations,
  summarizeCompliance
} from "../../../../lib/facility/compliance-service";
import { listFacilitySites } from "../../../../lib/facility/site-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.compliance:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const [obligations, sites] = await Promise.all([
      listComplianceObligations(authz.supabase, authz.organizationId),
      listFacilitySites(authz.supabase, authz.organizationId)
    ]);
    const summary = summarizeCompliance(obligations);
    return NextResponse.json({
      obligations,
      summary,
      assistantRecommendation: buildComplianceAssistant(summary),
      sites: sites.filter((site) => site.status === "active")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load compliance obligations" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.compliance:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = createComplianceObligationInputSchema.parse(await request.json());
    const obligation = await createComplianceObligation(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ obligation }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create obligation" },
      { status: 400 }
    );
  }
}
