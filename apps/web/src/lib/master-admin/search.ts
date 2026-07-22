import type { SupabaseClient } from "@supabase/supabase-js";

export type MasterAdminSearchResult = {
  id: string;
  entity: string;
  title: string;
  subtitle: string | null;
  href: string;
};

function matchesQuery(query: string, ...parts: Array<string | null | undefined>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return parts.some((part) => (part ?? "").toLowerCase().includes(q));
}

export async function searchMasterAdminEntities(
  client: SupabaseClient,
  organizationId: string,
  query: string,
  limit = 8
): Promise<MasterAdminSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const results: MasterAdminSearchResult[] = [];

  const [{ data: organizations }, { data: properties }, { data: tenants }, { data: vendors }, { data: memberships }] =
    await Promise.all([
      client.from("organizations").select("id, name, slug").order("name", { ascending: true }).limit(50),
      client
        .from("properties")
        .select("id, name, code")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name", { ascending: true })
        .limit(50),
      client
        .from("tenants")
        .select("id, first_name, last_name, preferred_name, email")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .limit(50),
      client
        .from("vendors")
        .select("id, business_name, email, primary_contact_name")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .limit(50),
      client
        .from("organization_memberships")
        .select("user_id, roles, status")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .limit(100)
    ]);

  for (const org of organizations ?? []) {
    if (!matchesQuery(q, org.name, org.slug)) continue;
    results.push({
      id: `org-${org.id}`,
      entity: "Organization",
      title: org.name,
      subtitle: org.slug,
      href: "/master-admin/impersonation"
    });
    if (results.length >= limit) return results;
  }

  const membershipRows = (memberships ?? []) as Array<{
    user_id: string;
    roles: string[] | null;
  }>;
  const userIds = [...new Set(membershipRows.map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await client
        .from("user_profiles")
        .select("user_id, display_name, contact_email")
        .in("user_id", userIds)
    : { data: [] as Array<{ user_id: string; display_name: string | null; contact_email: string | null }> };

  const profileByUser = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile] as const)
  );

  for (const membership of membershipRows) {
    const profile = profileByUser.get(membership.user_id);
    const roles = membership.roles ?? [];
    const displayName =
      profile?.display_name?.trim() ||
      profile?.contact_email ||
      `User ${membership.user_id.slice(0, 8)}`;
    if (!matchesQuery(q, displayName, profile?.contact_email, roles.join(" "))) continue;

    const roleLabel = roles.includes("property_manager")
      ? "Manager"
      : roles.includes("property_owner")
        ? "Owner"
        : roles.includes("tenant")
          ? "Resident"
          : roles.includes("vendor")
            ? "Vendor"
            : "Member";

    results.push({
      id: `person-${membership.user_id}`,
      entity: roleLabel,
      title: displayName,
      subtitle: profile?.contact_email ?? null,
      href: "/master-admin/impersonation"
    });
    if (results.length >= limit) return results;
  }

  for (const property of properties ?? []) {
    if (!matchesQuery(q, property.name, property.code)) continue;
    results.push({
      id: `property-${property.id}`,
      entity: "Property",
      title: property.name,
      subtitle: property.code,
      href: `/properties/${property.id}`
    });
    if (results.length >= limit) return results;
  }

  for (const tenant of tenants ?? []) {
    const name = [tenant.preferred_name, tenant.first_name, tenant.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!matchesQuery(q, name, tenant.email, tenant.first_name, tenant.last_name)) continue;
    results.push({
      id: `tenant-${tenant.id}`,
      entity: "Resident",
      title: name || tenant.email || "Resident",
      subtitle: tenant.email,
      href: `/tenants/${tenant.id}`
    });
    if (results.length >= limit) return results;
  }

  for (const vendor of vendors ?? []) {
    if (!matchesQuery(q, vendor.business_name, vendor.email, vendor.primary_contact_name)) continue;
    results.push({
      id: `vendor-${vendor.id}`,
      entity: "Vendor",
      title: vendor.business_name,
      subtitle: vendor.email ?? vendor.primary_contact_name,
      href: "/maintenance"
    });
    if (results.length >= limit) return results;
  }

  return results;
}
