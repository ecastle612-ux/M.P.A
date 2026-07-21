import { requireMasterAdminPageAccess } from "../../../../lib/master-admin/access";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { ImpersonationCenter } from "../../../../components/master-admin/impersonation-center";

type MembershipRow = { user_id: string; roles: string[] | null; status: string };
type ProfileRow = { user_id: string; display_name: string | null; contact_email: string | null };

export default async function MasterAdminImpersonationPage() {
  const { organizationId } = await requireMasterAdminPageAccess();
  const supabase = await createAuthServerComponentClient();

  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("user_id, roles, status")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .limit(200);

  const membershipRows = (memberships ?? []) as MembershipRow[];
  const userIds = [...new Set(membershipRows.map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("user_profiles")
        .select("user_id, display_name, contact_email")
        .in("user_id", userIds)
    : { data: [] as ProfileRow[] };

  const profileByUser = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.user_id, profile] as const)
  );

  const people = membershipRows.map((membership) => {
    const profile = profileByUser.get(membership.user_id);
    const roles = membership.roles ?? [];
    const primaryRole = roles[0] ?? "member";
    const displayName =
      profile?.display_name?.trim() ||
      profile?.contact_email ||
      `User ${membership.user_id.slice(0, 8)}`;
    return {
      userId: membership.user_id,
      displayName,
      email: profile?.contact_email ?? null,
      roles,
      roleLabel: primaryRole.replaceAll("_", " "),
      redirectTo: roles.includes("tenant")
        ? "/portal/tenant"
        : roles.includes("vendor")
          ? "/portal/vendor"
          : roles.includes("property_owner")
            ? "/portal/owner"
            : "/dashboard"
    };
  });

  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .order("name", { ascending: true })
    .limit(100);

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, code")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(100);

  return (
    <main className="mpa-page flex-1 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Impersonation Center
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Browse organizations and members. Impersonate without logging out - authentication stays
          Master Admin. Every session is audited.
        </p>
      </div>
      <ImpersonationCenter
        people={people}
        organizations={(organizations ?? []).map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug ?? null
        }))}
        properties={(properties ?? []).map((property) => ({
          id: property.id,
          name: property.name,
          code: property.code ?? null
        }))}
      />
    </main>
  );
}
