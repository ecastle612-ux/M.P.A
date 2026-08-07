import { NextResponse } from "next/server";
import { requireDocumentPermission } from "../../../../../lib/documents/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireDocumentPermission("platform.documents:read");
  if ("error" in authz) {
    return authz.error;
  }

  const [properties, residents, leases, workOrders, vendors, inspectionRuns] = await Promise.all([
    authz.supabase
      .from("property_properties")
      .select("id, name")
      .eq("organization_id", authz.organizationId)
      .order("name")
      .limit(100),
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
      .limit(100),
    authz.supabase
      .from("facility_inspection_runs")
      .select("id, status, due_on, facility_inspection_programs(name), facility_sites(property_id)")
      .eq("organization_id", authz.organizationId)
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  return NextResponse.json({
    targets: {
      property: (properties.data ?? []).map((row) => ({
        id: row.id as string,
        label: row.name as string,
        propertyId: row.id as string
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
      facility_inspection_run: (inspectionRuns.data ?? []).map((row) => {
        const program = Array.isArray(row.facility_inspection_programs)
          ? row.facility_inspection_programs[0]
          : row.facility_inspection_programs;
        const site = Array.isArray(row.facility_sites)
          ? row.facility_sites[0]
          : row.facility_sites;
        return {
          id: row.id as string,
          label:
            (program as { name?: string } | null)?.name
              ? `Inspection: ${(program as { name: string }).name} (${row.status})`
              : `Inspection run (${row.status})`,
          propertyId: (site as { property_id?: string | null } | null)?.property_id ?? null
        };
      })
    }
  });
}
