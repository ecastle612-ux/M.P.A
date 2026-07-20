import { redirect } from "next/navigation";
import {
  TeamSettingsPanel,
  type TeamMembership,
  type TeamPendingInvitation
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
      <TeamSettingsPanel initialInvitations={[]} initialMemberships={[]} canUpdate={false} />
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

  const [invitationResult, membershipResult] = await Promise.all([
    evaluatePermission(authorization, "invitation:read")
      ? supabase
          .from("organization_invitations")
          .select("id, email, roles, status, expires_at")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as TeamPendingInvitation[], error: null }),
    evaluatePermission(authorization, "membership:read")
      ? supabase
          .from("organization_memberships")
          .select("id, user_id, roles, status")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as TeamMembership[], error: null })
  ]);

  const membershipsRaw = (membershipResult.data ?? []) as TeamMembership[];
  const userIds = membershipsRaw.map((row) => row.user_id);
  const profileByUserId = new Map<string, { displayName: string | null; contactEmail: string | null }>();

  if (userIds.length > 0) {
    const service = createServiceRoleServerClient();
    const profileClient = service ?? supabase;
    const { data: profiles } = await profileClient
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

  const memberships: TeamMembership[] = membershipsRaw.map((row) => {
    const profile = profileByUserId.get(row.user_id);
    return {
      ...row,
      display_name: profile?.displayName ?? null,
      contact_email: profile?.contactEmail ?? null
    };
  });

  return (
    <TeamSettingsPanel
      initialInvitations={(invitationResult.data ?? []) as TeamPendingInvitation[]}
      initialMemberships={memberships}
      canUpdate={canUpdate}
    />
  );
}
