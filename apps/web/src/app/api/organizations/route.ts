import { NextResponse } from "next/server";
import { toSkuLabel } from "@mpa/shared";
import {
  ACTIVE_ORGANIZATION_COOKIE,
  createOrganizationSlugFromName,
  normalizeRoles,
  parseCreateOrganizationInput
} from "../../../lib/organization/contracts";
import { createAuthServerClient } from "../../../lib/auth/server";
import {
  assignOrganizationSubscription,
  isPlatformOperatorUser
} from "../../../lib/commercial/server";
import { getOrganizationsForUser } from "../../../lib/organization/server";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const organizations = await getOrganizationsForUser(user.id);
    const { data: invitationRows, error: invitationError } = await supabase
      .from("organization_invitations")
      .select("id, organization_id, email, roles, status, token, expires_at")
      .eq("email", user.email ?? "")
      .eq("status", "pending");

    if (invitationError) {
      return NextResponse.json({ error: invitationError.message }, { status: 400 });
    }

    return NextResponse.json({
      memberships: organizations.map((organization) => ({
        organizationId: organization.id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        roles: organization.roles,
        productSku: organization.productSku,
        productLabel: organization.productLabel,
        setupComplete: organization.setupComplete
      })),
      invitations: (invitationRows ?? []).map((row) => ({
        id: row.id,
        organization_id: row.organization_id,
        email: row.email,
        roles: normalizeRoles(row.roles),
        status: row.status,
        token: row.token,
        expires_at: row.expires_at
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load organizations" },
      { status: 400 }
    );
  }
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
    return NextResponse.json({ error: "Invalid payload. Organization name is required." }, { status: 400 });
  }

  // J0: Customer self-serve always receives Property Manager — not a SKU shopping cart.
  // Platform operators may still provision Facility / Complete at create time.
  const operator = await isPlatformOperatorUser(user);
  const productSku =
    operator && parsed.productSku ? parsed.productSku : "mpa_property_manager";

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

  const subscriptionResult = await assignOrganizationSubscription({
    organizationId: organization.id,
    sku: productSku,
    assignedBy: user.id
  });

  if (subscriptionResult.error) {
    return NextResponse.json({ error: subscriptionResult.error }, { status: 400 });
  }

  const response = NextResponse.json({
    organization,
    membership: {
      organizationId: organization.id,
      roles: ["property_manager"]
    },
    subscription: {
      productSku,
      productLabel: toSkuLabel(productSku)
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
