import { NextResponse } from "next/server";
import { createPmPlanInputSchema } from "@mpa/shared";
import { requireFacilityPreventivePermission } from "../../../../lib/facility/authz";
import {
  createPmPlan,
  FacilityPmConflictError,
  listPmPlans,
  summarizePmPlans
} from "../../../../lib/facility/pm-plan-service";
import { listPortfolioProperties } from "../../../../lib/property/property-catalog";
import { listWorkTemplates } from "../../../../lib/facility/work-template-service";
import { listFacilityAssets } from "../../../../lib/facility/asset-service";

export async function GET(request: Request) {
  const authz = await requireFacilityPreventivePermission();
  if ("error" in authz) return authz.error;
  const url = new URL(request.url);

  try {
    const [plans, properties, templates, assets] = await Promise.all([
      listPmPlans(authz.supabase, authz.organizationId, {
        ...(url.searchParams.get("assetId") ? { assetId: url.searchParams.get("assetId") ?? "" } : {}),
        ...(url.searchParams.get("status") ? { status: url.searchParams.get("status") ?? "" } : {})
      }),
      listPortfolioProperties(authz.supabase, authz.organizationId),
      listWorkTemplates(authz.supabase, authz.organizationId),
      listFacilityAssets(authz.supabase, authz.organizationId, {})
    ]);
    return NextResponse.json({
      plans,
      properties,
      templates: templates.filter((row) => row.status === "active"),
      assets,
      summary: summarizePmPlans(plans),
      canManage: true
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Preventive Maintenance" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPreventivePermission();
  if ("error" in authz) return authz.error;
  const payload = await request.json().catch(() => null);
  const parsed = createPmPlanInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const plan = await createPmPlan(authz.supabase, authz.organizationId, authz.user.id, parsed.data);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    const status = error instanceof FacilityPmConflictError ? 409 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create plan" },
      { status }
    );
  }
}
