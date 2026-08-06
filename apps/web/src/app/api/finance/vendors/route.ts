import { NextResponse } from "next/server";
import { createVendorInputSchema } from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { createVendor } from "../../../../lib/finance/collections-service";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }
  const { data, error } = await authz.supabase
    .from("vendor_vendors")
    .select("*")
    .eq("organization_id", authz.organizationId)
    .order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ vendors: data ?? [] });
}

export async function POST(request: Request) {
  const authz = await requireFinancePermission("pm.finance:vendor_invoice.review");
  if ("error" in authz) {
    return authz.error;
  }
  const payload = await request.json().catch(() => null);
  const parsed = createVendorInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const vendor = await createVendor(authz.supabase, authz.organizationId, parsed.data);
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create vendor" },
      { status: 400 }
    );
  }
}
