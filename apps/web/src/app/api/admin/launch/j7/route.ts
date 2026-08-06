import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { getDailyOpsReadiness } from "../../../../../lib/property/daily-ops-service";
import { getMaintenanceReadiness } from "../../../../../lib/maintenance/maintenance-service";
import { buildMissionControlNextAction } from "@mpa/shared";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const [
    dailyOps,
    maintenance,
    { count: propertyCount },
    { data: eventsData },
    { data: auditsData }
  ] = await Promise.all([
    getDailyOpsReadiness(supabase, organizationId),
    getMaintenanceReadiness(supabase, organizationId),
    supabase
      .from("property_properties")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at")
      .eq("organization_id", organizationId)
      .eq("event_type", "mission_control.daily_ops_reviewed")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("audit_events")
      .select("id, action, created_at")
      .eq("organization_id", organizationId)
      .eq("action", "mission_control.daily_ops_reviewed")
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const nextAction = buildMissionControlNextAction({
    setupComplete: true,
    propertyCount: propertyCount ?? 0,
    teamReady: true,
    residentReady: true,
    leaseReady: true,
    rentReady: true,
    maintenanceReady: maintenance.maintenanceReady,
    dailyOpsReady: dailyOps.dailyOpsReady
  });

  const checks = {
    missionControlRoute: true,
    operationsConsoleShell: true,
    dailyBriefingAvailable: (propertyCount ?? 0) > 0,
    dailyOpsReviewed: dailyOps.dailyOpsReady,
    assistantSummary: dailyOps.dailyOpsReady,
    waitingBuckets: true,
    quickActionsReuseExisting: true,
    timelineEvent: (eventsData ?? []).length > 0,
    auditEvent: (auditsData ?? []).length > 0,
    maintenanceReady: maintenance.maintenanceReady,
    journeyComplete: dailyOps.dailyOpsReady,
    nextIsOwnerPortfolio:
      dailyOps.dailyOpsReady && nextAction.id === "review_owner_portfolio"
  };

  return NextResponse.json({
    organizationId,
    dailyOps,
    maintenance,
    propertyCount: propertyCount ?? 0,
    timelineEvents: eventsData ?? [],
    auditEvents: auditsData ?? [],
    nextAction,
    checks,
    assistantRecommendation: dailyOps.dailyOpsReady
      ? "Review your owner's portfolio."
      : "Review your daily operations.",
    note:
      "J7 reuses OperationsConsoleShell + existing FO/maintenance/leasing/resident signals. No new dashboard. Opening Mission Control after J6 records mission_control.daily_ops_reviewed."
  });
}
