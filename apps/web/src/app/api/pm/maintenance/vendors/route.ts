import { NextResponse } from "next/server";
import { createVendorDirectoryInputSchema } from "@mpa/shared";
import { requireMaintenancePermission } from "../../../../../lib/maintenance/authz";
import { createVendorDirectory, listVendors } from "../../../../../lib/maintenance/maintenance-service";

export async function GET() {
  const authz = await requireMaintenancePermission("pm.maintenance:read");
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
  const authz = await requireMaintenancePermission("pm.maintenance:assign");
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
