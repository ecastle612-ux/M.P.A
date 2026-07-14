import { NextResponse } from "next/server";
import {
  ACTIVE_ORGANIZATION_COOKIE,
  createOrganizationSlugFromName,
  normalizeRoles,
  parseCreateOrganizationInput
} from "../../../lib/organization/contracts";
import { createAuthServerClient } from "../../../lib/auth/server";

type OrganizationMembershipRow = {
  id: string;
  organization_id: string;
  roles: string[];
  status: "active" | "inactive";
  organizations: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("id, organization_id, roles, status, organizations(id, name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 400 });
  }

  const { data: invitationRows, error: invitationError } = await supabase
    .from("organization_invitations")
    .select("id, organization_id, email, roles, status, token, expires_at")
    .eq("email", user.email ?? "")
    .eq("status", "pending");

  if (invitationError) {
    return NextResponse.json({ error: invitationError.message }, { status: 400 });
  }

  const memberships = ((membershipRows ?? []) as OrganizationMembershipRow[])
    .filter((row) => row.organizations)
    .map((row) => ({
      membershipId: row.id,
      organizationId: row.organization_id,
      organizationName: row.organizations?.name ?? "",
      organizationSlug: row.organizations?.slug ?? "",
      roles: row.roles
    }));

  const invitations = (invitationRows ?? []).map((row) => ({
    id: row.id,
    organization_id: row.organization_id,
    email: row.email,
    roles: normalizeRoles(row.roles),
    status: row.status,
    token: row.token,
    expires_at: row.expires_at
  }));

  return NextResponse.json({
    memberships,
    invitations
  });
}

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseCreateOrganizationInput(payload);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const slugCandidate = parsed.slug ?? createOrganizationSlugFromName(parsed.name);
  const slug = `${slugCandidate}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      name: parsed.name,
      slug,
      created_by: user.id
    })
    .select("id, name, slug")
    .single();

  if (organizationError || !organization) {
    return NextResponse.json({ error: organizationError?.message ?? "Organization creation failed" }, { status: 400 });
  }

  const { error: membershipError } = await supabase.from("organization_memberships").insert({
    organization_id: organization.id,
    user_id: user.id,
    roles: ["property_manager"],
    status: "active"
  });

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 400 });
  }

  const response = NextResponse.json({
    organization,
    membership: {
      organizationId: organization.id,
      roles: ["property_manager"]
    }
  });

  response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, organization.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
