import { NextResponse } from "next/server";
import { requirePartnerServicesRead } from "../../../../lib/partners/authz";

export const runtime = "nodejs";

export async function GET() {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const { data, error } = await authz.supabase
    .from("property_properties")
    .select("id, name, address_line1, city, state")
    .eq("organization_id", authz.organizationId)
    .order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({
    properties: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      label: [row.name, row.address_line1, row.city, row.state].filter(Boolean).join(" · ")
    }))
  });
}
