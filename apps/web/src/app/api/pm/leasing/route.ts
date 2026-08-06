import { NextResponse } from "next/server";
import { createLeaseInputSchema } from "@mpa/shared";
import { requireLeasingPermission } from "../../../../lib/leasing/authz";
import {
  createLeaseFromResident,
  listLeases,
  listPendingLeaseResidents
} from "../../../../lib/leasing/lease-service";

export async function GET() {
  const authz = await requireLeasingPermission("pm.leasing:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const [leases, pendingResidents] = await Promise.all([
      listLeases(authz.supabase, authz.organizationId),
      listPendingLeaseResidents(authz.supabase, authz.organizationId)
    ]);
    return NextResponse.json({ leases, pendingResidents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list leases" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireLeasingPermission("pm.leasing:write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createLeaseInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createLeaseFromResident(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lease" },
      { status: 400 }
    );
  }
}
