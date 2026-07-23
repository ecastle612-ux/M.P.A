import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { VENDOR_PAYMENT_METHODS } from "../../../../../lib/vendor-payments/contracts";
import { markVendorInvoicePaid } from "../../../../../lib/vendor-payments/server";

type Ctx = { params: Promise<{ invoiceId: string }> };

export async function POST(request: Request, context: Ctx) {
  const { invoiceId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (
    !evaluatePermission(authorization, "maintenance:update") &&
    !evaluatePermission(authorization, "financial:update")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    amount?: number;
    paidAt?: string;
    paymentMethod?: string;
    referenceNumber?: string | null;
    notes?: string | null;
  };

  const paymentMethod = (body.paymentMethod ?? "mark_paid") as (typeof VENDOR_PAYMENT_METHODS)[number];
  if (!VENDOR_PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  try {
    const result = await markVendorInvoicePaid(
      organizationId,
      invoiceId,
      user.id,
      {
        ...(typeof body.amount === "number" ? { amount: body.amount } : {}),
        ...(body.paidAt ? { paidAt: body.paidAt } : {}),
        paymentMethod,
        ...(body.referenceNumber !== undefined ? { referenceNumber: body.referenceNumber } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {})
      },
      supabase
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mark paid failed" },
      { status: 400 }
    );
  }
}
