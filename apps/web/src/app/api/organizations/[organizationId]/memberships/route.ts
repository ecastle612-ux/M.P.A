import { NextResponse } from "next/server";
import { parseUpdateOrganizationMembershipInput } from "../../../../../lib/organization/contracts";
import { createAuthServerClient, createServiceRoleServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";

async function requireMembership(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  organizationId: string
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, organizationId);
  const canReadMemberships = evaluatePermission(authorizationContext, "membership:read");
  const canUpdateMemberships = evaluatePermission(authorizationContext, "membership:update");
  if (!canReadMemberships && !canUpdateMemberships) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, canReadMemberships, canUpdateMemberships };
}

export async function GET(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();

  const authz = await requireMembership(supabase, organizationId);
  if ("error" in authz) {
    return authz.error;
  }
  if (!authz.canReadMemberships) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("organization_memberships")
    .select("id, user_id, roles, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const memberships = data ?? [];
  const userIds = memberships.map((row) => row.user_id);
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

  return NextResponse.json({
    memberships: memberships.map((row) => {
      const profile = profileByUserId.get(row.user_id);
      return {
        ...row,
        display_name: profile?.displayName ?? null,
        contact_email: profile?.contactEmail ?? null
      };
    }),
    canUpdate: authz.canUpdateMemberships
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();
  const authz = await requireMembership(supabase, organizationId);
  if ("error" in authz) {
    return authz.error;
  }
  if (!authz.canUpdateMemberships) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseUpdateOrganizationMembershipInput(payload);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updateData: { roles?: string[]; status?: "active" | "inactive" } = {};
  if (parsed.roles) {
    updateData.roles = parsed.roles;
  }
  if (parsed.status) {
    updateData.status = parsed.status;
  }

  const { data, error } = await supabase
    .from("organization_memberships")
    .update(updateData)
    .eq("organization_id", organizationId)
    .eq("id", parsed.membershipId)
    .select("id, user_id, roles, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ membership: data });
}
