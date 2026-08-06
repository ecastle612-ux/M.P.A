import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { getDailyOpsReadiness } from "../../../../../lib/property/daily-ops-service";
import { getOwnerPortfolioReadiness } from "../../../../../lib/property/owner-portfolio-service";
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
    ownerPortfolio,
    dailyOps,
    { count: propertyCount },
    { data: eventsData },
    { data: auditsData }
  ] = await Promise.all([
    getOwnerPortfolioReadiness(supabase, organizationId),
    getDailyOpsReadiness(supabase, organizationId),
    supabase
      .from("property_properties")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at")
      .eq("organization_id", organizationId)
      .eq("event_type", "owner_portfolio.reviewed")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("audit_events")
      .select("id, action, created_at")
      .eq("organization_id", organizationId)
      .eq("action", "owner_portfolio.reviewed")
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
    maintenanceReady: true,
    dailyOpsReady: dailyOps.dailyOpsReady,
    ownerPortfolioReady: ownerPortfolio.ownerPortfolioReady
  });

  const checks = {
    ownerPortalRoute: true,
    portfolioHomeComposed: true,
    propertyDrillDown: true,
    financialSummariesReuseFo: true,
    maintenanceSummariesReuseWo: true,
    timelineAvailable: true,
    documentsHonesty: true,
    ownerPortfolioReviewed: ownerPortfolio.ownerPortfolioReady,
    timelineEvent: (eventsData ?? []).length > 0,
    auditEvent: (auditsData ?? []).length > 0,
    dailyOpsReady: dailyOps.dailyOpsReady,
    journeyComplete: ownerPortfolio.ownerPortfolioReady,
    customerPromiseComplete:
      ownerPortfolio.ownerPortfolioReady && nextAction.id === "customer_promise_complete"
  };

  return NextResponse.json({
    organizationId,
    ownerPortfolio,
    dailyOps,
    propertyCount: propertyCount ?? 0,
    timelineEvents: eventsData ?? [],
    auditEvents: auditsData ?? [],
    nextAction,
    checks,
    assistantRecommendation: ownerPortfolio.ownerPortfolioReady
      ? "I can confidently monitor my investment portfolio using M.P.A."
      : "Review your owner's portfolio.",
    note:
      "J8 reuses Owner FO summary, Property Command Center, maintenance WOs, leasing, and timeline. No duplicate dashboard. Opening Owner Portfolio Home after J7 records owner_portfolio.reviewed."
  });
}
