import { NextResponse } from "next/server";
import { createLeaseResidentInputSchema } from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { createLeaseWithResident } from "../../../../lib/finance/billing-service";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { data, error } = await authz.supabase
    .from("lease_agreements")
    .select("*, lease_residents(*), property_properties(id, name)")
    .eq("organization_id", authz.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ leases: data ?? [] });
}

export async function POST(request: Request) {
  const authz = await requireFinancePermission("pm.finance:charge.write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createLeaseResidentInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // Compatibility path for billing scaffolding. Customer create for residents is /pm/residents (J3).
    const result = await createLeaseWithResident(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(
      {
        ...result,
        notice:
          "Prefer /pm/residents for the customer resident create path (LAUNCH-001 J3). Lease create is the next journey."
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lease" },
      { status: 400 }
    );
  }
}
