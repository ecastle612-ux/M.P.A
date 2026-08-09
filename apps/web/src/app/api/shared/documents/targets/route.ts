import { NextResponse } from "next/server";
import { requireDocumentPermission } from "../../../../../lib/documents/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireDocumentPermission("platform.documents:read");
  if ("error" in authz) {
    return authz.error;
  }

  const [properties, units, residents, leases, workOrders, vendors] = await Promise.all([
    authz.supabase
      .from("property_properties")
      .select("id, name")
      .eq("organization_id", authz.organizationId)
      .order("name")
      .limit(100),
    authz.supabase
      .from("property_units")
      .select("id, unit_label, property_id")
      .eq("organization_id", authz.organizationId)
      .order("unit_label")
      .limit(200),
    authz.supabase
      .from("pm_residents")
      .select("id, display_name, property_id")
      .eq("organization_id", authz.organizationId)
      .order("display_name")
      .limit(100),
    authz.supabase
      .from("lease_agreements")
      .select("id, document_name, property_id, status")
      .eq("organization_id", authz.organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
    authz.supabase
      .from("maintenance_work_orders")
      .select("id, title, property_id")
      .eq("organization_id", authz.organizationId)
      .order("submitted_at", { ascending: false })
      .limit(100),
    authz.supabase
      .from("vendor_vendors")
      .select("id, name")
      .eq("organization_id", authz.organizationId)
      .order("name")
      .limit(100)
  ]);

  return NextResponse.json({
    targets: {
      property: (properties.data ?? []).map((row) => ({
        id: row.id as string,
        label: row.name as string,
        propertyId: row.id as string
      })),
      unit: (units.data ?? []).map((row) => ({
        id: row.id as string,
        label: (row.unit_label as string) || "Unit",
        propertyId: (row.property_id as string | null) ?? null
      })),
      resident: (residents.data ?? []).map((row) => ({
        id: row.id as string,
        label: row.display_name as string,
        propertyId: (row.property_id as string | null) ?? null
      })),
      lease: (leases.data ?? []).map((row) => ({
        id: row.id as string,
        label: (row.document_name as string | null) || `Lease (${row.status})`,
        propertyId: (row.property_id as string | null) ?? null
      })),
      maintenance: (workOrders.data ?? []).map((row) => ({
        id: row.id as string,
        label: row.title as string,
        propertyId: (row.property_id as string | null) ?? null
      })),
      vendor: (vendors.data ?? []).map((row) => ({
        id: row.id as string,
        label: row.name as string,
        propertyId: null
      })),
      // FO / finance entity pickers land when those workflow packages activate.
      asset: [],
      inspection: [],
      compliance: [],
      financial: [],
      building: []
    }
  });
}
