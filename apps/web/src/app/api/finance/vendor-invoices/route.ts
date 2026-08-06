import { NextResponse } from "next/server";
import { createVendorInvoiceInputSchema, reviewVendorInvoiceInputSchema } from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import {
  createVendorInvoice,
  listVendorInvoices,
  reviewVendorInvoice
} from "../../../../lib/finance/collections-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const status = searchParams.get("status");

  try {
    const invoices = await listVendorInvoices(authz.supabase, {
      organizationId: authz.organizationId,
      ...(propertyId ? { propertyId } : {}),
      ...(status ? { status } : {})
    });
    return NextResponse.json({ invoices });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load vendor invoices" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  try {
    if (payload?.action === "review") {
      const authz = await requireFinancePermission("pm.finance:vendor_invoice.review");
      if ("error" in authz) {
        return authz.error;
      }
      const parsed = reviewVendorInvoiceInputSchema.safeParse({
        invoiceId: payload.invoiceId,
        action: payload.reviewAction ?? payload.actionKind,
        reason: payload.reason ?? payload.note,
        scheduledFor: payload.scheduledFor,
        paymentMethod: payload.paymentMethod
      });
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
      }
      if (parsed.data.action === "schedule" || parsed.data.action === "mark_paid") {
        const release = await requireFinancePermission("pm.finance:vendor_payment.release");
        if ("error" in release) {
          return release.error;
        }
        const result = await reviewVendorInvoice(
          release.supabase,
          release.organizationId,
          release.user.id,
          parsed.data
        );
        return NextResponse.json(result);
      }
      const result = await reviewVendorInvoice(
        authz.supabase,
        authz.organizationId,
        authz.user.id,
        parsed.data
      );
      return NextResponse.json(result);
    }

    const authz = await requireFinancePermission("pm.finance:vendor_invoice.review");
    if ("error" in authz) {
      return authz.error;
    }
    const parsed = createVendorInvoiceInputSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }
    const invoice = await createVendorInvoice(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Vendor invoice action failed" },
      { status: 400 }
    );
  }
}
