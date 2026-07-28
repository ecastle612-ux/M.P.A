import { redirect } from "next/navigation";
import {
  TeamSettingsPanel,
  type TeamMembership,
  type TeamPendingInvitation,
  type TeamPropertyOption
} from "../../../../components/settings/team-settings-panel";
import {
  createAuthServerComponentClient,
  createServiceRoleServerClient
} from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";

export default async function TeamSettingsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <TeamSettingsPanel
        initialInvitations={[]}
        initialMemberships={[]}
        initialProperties={[]}
        canUpdate={false}
      />
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (
    !evaluatePermission(authorization, "membership:read") &&
    !evaluatePermission(authorization, "invitation:read")
  ) {
    redirect("/unauthorized");
  }

  const canUpdate = evaluatePermission(authorization, "membership:update");

  const [invitationResult, membershipResult, propertyResult] = await Promise.all([
    evaluatePermission(authorization, "invitation:read")
      ? supabase
          .from("organization_invitations")
          .select("id, email, roles, status, expires_at, property_ids")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as TeamPendingInvitation[], error: null }),
    evaluatePermission(authorization, "membership:read")
      ? supabase
          .from("organization_memberships")
          .select("id, user_id, roles, status")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as TeamMembership[], error: null }),
    supabase
      .from("properties")
      .select("id, name")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true })
  ]);

  const membershipsRaw = (membershipResult.data ?? []) as TeamMembership[];
  const userIds = membershipsRaw.map((row) => row.user_id);
  const membershipIds = membershipsRaw.map((row) => row.id);
  const profileByUserId = new Map<string, { displayName: string | null; contactEmail: string | null }>();
  const propertyIdsByMembershipId = new Map<string, string[]>();

  const service = createServiceRoleServerClient();
  const dataClient = service ?? supabase;

  if (userIds.length > 0) {
    const { data: profiles } = await dataClient
      .from("user_profiles")
      .select("user_id, display_name, contact_email")
      .in("user_id", userIds);

    for (const profile of profiles ?? []) {
      profileByUserId.set(profile.user_id, {
        displayName: profile.display_name ?? null,
        contactEmail: profile.contact_email ?? null
      });
    }
  }

  if (membershipIds.length > 0) {
    const { data: scopes } = await dataClient
      .from("membership_property_scopes")
      .select("membership_id, property_id")
      .eq("organization_id", organizationId)
      .in("membership_id", membershipIds);

    for (const scope of (scopes ?? []) as Array<{ membership_id: string; property_id: string }>) {
      const membershipId = String(scope.membership_id);
      const existing = propertyIdsByMembershipId.get(membershipId) ?? [];
      existing.push(String(scope.property_id));
      propertyIdsByMembershipId.set(membershipId, existing);
    }
  }

  const memberships: TeamMembership[] = membershipsRaw.map((row) => {
    const profile = profileByUserId.get(row.user_id);
    return {
      ...row,
      display_name: profile?.displayName ?? null,
      contact_email: profile?.contactEmail ?? null,
      property_ids: propertyIdsByMembershipId.get(row.id) ?? []
    };
  });

  const properties: TeamPropertyOption[] = ((propertyResult.data ?? []) as TeamPropertyOption[]).map(
    (row) => ({ id: row.id, name: row.name })
  );

  return (
    <TeamSettingsPanel
      initialInvitations={(invitationResult.data ?? []) as TeamPendingInvitation[]}
      initialMemberships={memberships}
      initialProperties={properties}
      canUpdate={canUpdate}
    />
  );
}
