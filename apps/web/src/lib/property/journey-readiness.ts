import type { SupabaseClient } from "@supabase/supabase-js";
import { emitPropertyEvent, writePropertyAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

/**
 * Leaf readiness helpers for LAUNCH journeys J7/J8.
 * Kept free of finance/reporting/orchestration imports so Mission Control
 * can compose readiness without circular module edges.
 */
export async function getDailyOpsReadiness(supabase: Db, organizationId: string) {
  const { count, error } = await supabase
    .from("event_domain_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("event_type", "mission_control.daily_ops_reviewed");
  if (error) {
    throw new Error(error.message);
  }
  const reviewCount = count ?? 0;
  return {
    reviewCount,
    dailyOpsReady: reviewCount > 0
  };
}

export async function markDailyOpsReviewed(
  supabase: Db,
  organizationId: string,
  actorId: string,
  maintenanceReady: boolean
) {
  if (!maintenanceReady) {
    return { marked: false };
  }
  const existing = await getDailyOpsReadiness(supabase, organizationId);
  if (existing.dailyOpsReady) {
    return { marked: false, ...existing };
  }

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "mission_control.daily_ops_reviewed",
    aggregateType: "organizations",
    aggregateId: organizationId,
    payload: { source: "mission_control" }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "mission_control.daily_ops_reviewed",
    entityType: "organizations",
    entityId: organizationId,
    payload: { source: "mission_control" }
  });

  return { marked: true, dailyOpsReady: true, reviewCount: 1 };
}

export async function getOwnerPortfolioReadiness(supabase: Db, organizationId: string) {
  const { count, error } = await supabase
    .from("event_domain_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("event_type", "owner_portfolio.reviewed");
  if (error) {
    throw new Error(error.message);
  }
  const reviewCount = count ?? 0;
  return {
    reviewCount,
    ownerPortfolioReady: reviewCount > 0
  };
}

export async function markOwnerPortfolioReviewed(
  supabase: Db,
  organizationId: string,
  actorId: string,
  dailyOpsReady: boolean
) {
  if (!dailyOpsReady) {
    return { marked: false };
  }
  const existing = await getOwnerPortfolioReadiness(supabase, organizationId);
  if (existing.ownerPortfolioReady) {
    return { marked: false, ...existing };
  }

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "owner_portfolio.reviewed",
    aggregateType: "organizations",
    aggregateId: organizationId,
    payload: { source: "owner_portfolio_home" }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "owner_portfolio.reviewed",
    entityType: "organizations",
    entityId: organizationId,
    payload: { source: "owner_portfolio_home" }
  });

  return { marked: true, ownerPortfolioReady: true, reviewCount: 1 };
}
