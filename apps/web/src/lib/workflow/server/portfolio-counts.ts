import { createAuthServerComponentClient } from "../../auth/server";
import { getOrganizationsForUser } from "../../organization/server";
import { getPropertiesForOrganization } from "../../property/server";
import { getTenantsForOrganization } from "../../tenant/server";
import { getUnitsForOrganization } from "../../unit/server";
import { getVendorsForOrganization } from "../../vendor/server";
import type { PortfolioCounts } from "../shared/types";

export async function getPortfolioCounts(organizationId: string | null): Promise<PortfolioCounts> {
  if (!organizationId) {
    return {
      organizations: 0,
      properties: 0,
      units: 0,
      tenants: 0,
      leases: 0,
      activeLeases: 0,
      vendors: 0,
      payments: 0,
      invitations: 0
    };
  }

  const supabase = await createAuthServerComponentClient();
  const [properties, units, tenants, vendors, leaseTotal, activeLeases, payments, invitations] = await Promise.all([
    getPropertiesForOrganization(organizationId),
    getUnitsForOrganization(organizationId),
    getTenantsForOrganization(organizationId),
    getVendorsForOrganization(organizationId),
    supabase
      .from("leases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("leases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending")
  ]);

  return {
    organizations: 1,
    properties: properties.length,
    units: units.length,
    tenants: tenants.length,
    leases: leaseTotal.count ?? 0,
    activeLeases: activeLeases.count ?? 0,
    vendors: vendors.length,
    payments: payments.count ?? 0,
    invitations: invitations.count ?? 0
  };
}

export async function getPortfolioCountsForUser(userId: string): Promise<PortfolioCounts> {
  const organizations = await getOrganizationsForUser(userId);
  if (organizations.length === 0) {
    return getPortfolioCounts(null);
  }
  return getPortfolioCounts(organizations[0]?.id ?? null);
}
