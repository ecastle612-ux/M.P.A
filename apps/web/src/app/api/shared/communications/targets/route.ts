import { NextResponse } from "next/server";
import { requireCommunicationsPermission } from "../../../../../lib/communications/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireCommunicationsPermission("platform.communications:read");
  if ("error" in authz) {
    return authz.error;
  }

  const [residents, vendors, memberships] = await Promise.all([
    authz.supabase
      .from("pm_residents")
      .select("id, display_name, email, property_id")
      .eq("organization_id", authz.organizationId)
      .order("display_name")
      .limit(100),
    authz.supabase
      .from("vendor_vendors")
      .select("id, name, email")
      .eq("organization_id", authz.organizationId)
      .order("name")
      .limit(100),
    authz.supabase
      .from("organization_memberships")
      .select("user_id, roles")
      .eq("organization_id", authz.organizationId)
      .eq("status", "active")
  ]);

  const ownerIds = (memberships.data ?? [])
    .filter((row) => ((row.roles as string[] | null) ?? []).includes("property_owner"))
    .map((row) => row.user_id as string);

  const { data: ownerProfiles } =
    ownerIds.length > 0
      ? await authz.supabase
          .from("user_profiles")
          .select("user_id, display_name, contact_email")
          .in("user_id", ownerIds)
      : { data: [] as Array<{ user_id: string; display_name: string | null; contact_email: string | null }> };

  return NextResponse.json({
    targets: {
      resident: (residents.data ?? []).map((row) => ({
        id: row.id as string,
        label: row.display_name as string,
        detail: (row.email as string | null) ?? null
      })),
      vendor: (vendors.data ?? []).map((row) => ({
        id: row.id as string,
        label: row.name as string,
        detail: (row.email as string | null) ?? null
      })),
      owner: (ownerProfiles ?? []).map((row) => ({
        id: row.user_id,
        label: row.display_name ?? "Owner",
        detail: row.contact_email
      }))
    }
  });
}
