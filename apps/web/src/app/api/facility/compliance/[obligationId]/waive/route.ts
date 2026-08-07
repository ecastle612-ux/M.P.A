import { NextResponse } from "next/server";
import { waiveComplianceObligationInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../../lib/facility/authz";
import { waiveComplianceObligation } from "../../../../../../lib/facility/compliance-service";

type Params = { params: Promise<{ obligationId: string }> };

export async function POST(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.compliance:waive");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const { obligationId: paramObligationId } = await context.params;
    const json = await request.json();
    const body = waiveComplianceObligationInputSchema.parse({
      ...json,
      obligationId: paramObligationId ?? json.obligationId
    });
    const obligation = await waiveComplianceObligation(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ obligation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to waive obligation" },
      { status: 400 }
    );
  }
}
