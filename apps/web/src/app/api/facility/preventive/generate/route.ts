import { NextResponse } from "next/server";
import { generatePmWorkInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { generateDuePmWork } from "../../../../../lib/facility/pm-service";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.preventive:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = generatePmWorkInputSchema.parse(await request.json().catch(() => ({})));
    const result = await generateDuePmWork(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body.asOf
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PM work" },
      { status: 400 }
    );
  }
}
