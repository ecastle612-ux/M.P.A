import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildDailyOpsReadyAssistantCopy,
  buildMissionControlNextAction,
  buildOwnerPortfolioReadyAssistantCopy,
  type UserRole
} from "@mpa/shared";
import { buildDailyOperationsBriefing } from "./daily-ops-service";
import {
  getDailyOpsReadiness,
  getOwnerPortfolioReadiness,
  markDailyOpsReviewed
} from "./journey-readiness";
import { listPortfolioProperties } from "./property-catalog";

export type { PortfolioProperty } from "./property-catalog";
export {
  createPortfolioProperty,
  getPortfolioProperty,
  listPortfolioProperties,
  listPropertyTimeline,
  searchPortfolioProperties
} from "./property-catalog";
export { getPropertyCommandCenter } from "./property-command-center";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

/**
 * Mission Control orchestration.
 * Composes leaf readiness modules + daily-ops briefing without owning catalog mutations.
 */
export async function getMissionControlState(
  supabase: Db,
  organizationId: string,
  setupComplete: boolean,
  actor?: {
    userId: string;
    displayName?: string | null;
    organizationName?: string | null;
    roles?: UserRole[];
    permissions?: readonly string[] | null;
  }
) {
  const properties = await listPortfolioProperties(supabase, organizationId);
  const first = properties[0] ?? null;
  const { getTeamReadiness } = await import("../team/invitation-service");
  const { getResidentReadiness } = await import("../resident/resident-service");
  const { getLeaseReadiness } = await import("../leasing/lease-readiness");
  const { getRentReadiness } = await import("../finance/rent-readiness");
  const { getMaintenanceReadiness } = await import("../maintenance/maintenance-service");
  const { primaryRole } = await import("@mpa/shared");
  const team = await getTeamReadiness(supabase, organizationId);
  const residents = await getResidentReadiness(supabase, organizationId);
  const leases = await getLeaseReadiness(supabase, organizationId);
  const rent = await getRentReadiness(supabase, organizationId);
  const maintenance = await getMaintenanceReadiness(supabase, organizationId);

  let dailyOps = await getDailyOpsReadiness(supabase, organizationId);
  const actorRole = primaryRole(actor?.roles ?? []);
  const canMarkDailyOps =
    actorRole === "organization_admin" || actorRole === "property_manager";
  // Only managers advance J7 by reviewing Mission Control — never leasing/tech GET side-effects.
  if (
    canMarkDailyOps &&
    actor?.userId &&
    maintenance.maintenanceReady &&
    !dailyOps.dailyOpsReady
  ) {
    await markDailyOpsReviewed(
      supabase,
      organizationId,
      actor.userId,
      maintenance.maintenanceReady
    );
    dailyOps = await getDailyOpsReadiness(supabase, organizationId);
  }

  const ownerPortfolio = await getOwnerPortfolioReadiness(supabase, organizationId);
  const recommendationRole = actorRole ?? "property_manager";

  const nextAction = buildMissionControlNextAction({
    setupComplete,
    propertyCount: properties.length,
    firstPropertyId: first?.id ?? null,
    teamReady: team.teamReady,
    residentReady: residents.residentReady,
    leaseReady: leases.leaseReady,
    rentReady: rent.rentReady,
    maintenanceReady: maintenance.maintenanceReady,
    dailyOpsReady: dailyOps.dailyOpsReady,
    ownerPortfolioReady: ownerPortfolio.ownerPortfolioReady,
    actorRole: recommendationRole
  });

  const dailyOperations =
    actor?.userId && (maintenance.maintenanceReady || properties.length > 0)
      ? await buildDailyOperationsBriefing(supabase, organizationId, actor, {
          organizationName: actor.organizationName ?? null,
          propertyCount: properties.length,
          firstActionTitle: nextAction.title
        })
      : null;

  return {
    propertyCount: properties.length,
    properties: properties.slice(0, 5).map((property) => ({
      id: property.id,
      name: property.name,
      status: property.status,
      unitCount: property.property_units?.length ?? 0
    })),
    teamReady: team.teamReady,
    activeMemberCount: team.activeMemberCount,
    acceptedInviteCount: team.acceptedInviteCount,
    residentReady: residents.residentReady,
    residentCount: residents.residentCount,
    leaseReady: leases.leaseReady,
    leaseCount: leases.leaseCount,
    rentReady: rent.rentReady,
    paymentCount: rent.paymentCount,
    maintenanceReady: maintenance.maintenanceReady,
    closedWorkOrderCount: maintenance.closedCount,
    dailyOpsReady: dailyOps.dailyOpsReady,
    ownerPortfolioReady: ownerPortfolio.ownerPortfolioReady,
    nextAction,
    assistantRecommendation: ownerPortfolio.ownerPortfolioReady
      ? buildOwnerPortfolioReadyAssistantCopy()
      : dailyOps.dailyOpsReady
        ? buildDailyOpsReadyAssistantCopy()
        : nextAction.assistantRecommendation,
    dailyOperations
  };
}
