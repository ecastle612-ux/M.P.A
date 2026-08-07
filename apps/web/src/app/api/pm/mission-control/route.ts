import { NextResponse } from "next/server";
import { requirePropertyPermission } from "../../../../lib/property/authz";
import { getMissionControlState } from "../../../../lib/property/property-service";
import { getOrganizationCommercialState } from "../../../../lib/commercial/server";

export async function GET() {
  const authz = await requirePropertyPermission("pm.properties:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const commercial = await getOrganizationCommercialState(authz.organizationId);
    const [{ data: profile }, { data: organization }] = await Promise.all([
      authz.supabase
        .from("user_profiles")
        .select("display_name, contact_email")
        .eq("user_id", authz.user.id)
        .maybeSingle(),
      authz.supabase.from("organizations").select("name").eq("id", authz.organizationId).maybeSingle()
    ]);
    const profileRow = profile as { display_name?: string | null; contact_email?: string | null } | null;
    const organizationName =
      organization && typeof (organization as { name?: string }).name === "string"
        ? (organization as { name: string }).name
        : null;

    const { data: membership } = await authz.supabase
      .from("organization_memberships")
      .select("roles")
      .eq("organization_id", authz.organizationId)
      .eq("user_id", authz.user.id)
      .eq("status", "active")
      .maybeSingle();

    const { isUserRole } = await import("@mpa/shared");
    const roles = ((membership?.roles as unknown[]) ?? []).filter(isUserRole);

    const state = await getMissionControlState(
      authz.supabase,
      authz.organizationId,
      commercial.setupComplete,
      {
        userId: authz.user.id,
        displayName: profileRow?.display_name ?? profileRow?.contact_email ?? authz.user.email ?? null,
        organizationName,
        roles
      }
    );
    return NextResponse.json({
      ...state,
      organizationId: authz.organizationId,
      productSku: commercial.sku,
      productLabel: commercial.skuLabel,
      setupComplete: commercial.setupComplete
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Mission Control" },
      { status: 400 }
    );
  }
}
