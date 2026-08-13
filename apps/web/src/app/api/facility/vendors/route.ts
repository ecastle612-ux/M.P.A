import { NextResponse } from "next/server";
import { createVendorDirectoryInputSchema } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../lib/facility/authz";
import {
  createVendorDirectory,
  listVendors
} from "../../../../lib/maintenance/maintenance-service";

/**
 * FO vendor directory — reuses vendor_vendors + createVendorDirectory.
 * Gated by facility.operations so FO-only orgs can manage vendors without PM directory access.
 */
export async function GET() {
  const authz = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const vendors = await listVendors(authz.supabase, authz.organizationId);
    return NextResponse.json({ vendors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list vendors" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityOperation("pm.maintenance:assign", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createVendorDirectoryInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Facility assign path provisions portal access — email is required for FO create.
  if (!parsed.data.email?.trim()) {
    return NextResponse.json(
      {
        error:
          "Vendor email is required for Facility Operations so work can be assigned and the vendor portal provisioned."
      },
      { status: 400 }
    );
  }

  try {
    const vendor = await createVendorDirectory(authz.supabase, authz.organizationId, parsed.data);
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create vendor" },
      { status: 400 }
    );
  }
}
