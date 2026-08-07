import { NextResponse } from "next/server";
import { isProductSku } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const [{ data: organization }, { data: subscription }, { data: setup }, { data: memberships }] =
    await Promise.all([
      supabase.from("organizations").select("id, name, slug, created_at").eq("id", organizationId).maybeSingle(),
      supabase
        .from("organization_subscriptions")
        .select("organization_id, sku_code, status")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("organization_setup_state")
        .select("organization_id, completed_at, updated_at")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("organization_memberships")
        .select("id, user_id, roles, status")
        .eq("organization_id", organizationId)
        .eq("status", "active")
    ]);

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const sku =
    subscription && isProductSku(subscription.sku_code) ? subscription.sku_code : null;
  const propertyManagerAssigned = sku === "mpa_property_manager";
  const setupComplete = Boolean(setup?.completed_at);
  const hasActiveMember = (memberships ?? []).length > 0;

  const checks = {
    organizationCreated: Boolean(organization.id),
    propertyManagerSkuAssigned: propertyManagerAssigned,
    subscriptionActive:
      Boolean(subscription) &&
      ["active", "trialing"].includes(String(subscription?.status ?? "")),
    setupComplete,
    activeMembership: hasActiveMember,
    trustedHomeReady: propertyManagerAssigned && setupComplete,
    assistantNextIsAddProperty: propertyManagerAssigned && setupComplete
  };

  return NextResponse.json({
    organizationId,
    organization,
    subscription,
    setup,
    membershipCount: memberships?.length ?? 0,
    checks,
    assistantRecommendation: checks.trustedHomeReady
      ? "Add your first property."
      : "Complete Guided Setup.",
    note:
      "J0 evidence: org + Property Manager SKU + Guided Setup complete. Purchase may be white-glove / Admin assign for Customer #1."
  });
}
