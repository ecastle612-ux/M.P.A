import { NextResponse } from "next/server";
import { satisfyComplianceObligationInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../../lib/facility/authz";
import { satisfyComplianceObligation } from "../../../../../../lib/facility/compliance-service";

type Params = { params: Promise<{ obligationId: string }> };

export async function POST(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.compliance:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const { obligationId: paramObligationId } = await context.params;
    const json = await request.json();
    const body = satisfyComplianceObligationInputSchema.parse({
      ...json,
      obligationId: paramObligationId ?? json.obligationId
    });
    const obligation = await satisfyComplianceObligation(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ obligation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to satisfy obligation" },
      { status: 400 }
    );
  }
}
