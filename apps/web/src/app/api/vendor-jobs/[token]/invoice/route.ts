import { NextResponse } from "next/server";
import { getInvoiceByToken, submitVendorInvoiceByToken } from "../../../../../lib/vendor-payments/server";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { token } = await context.params;
    const invoice = await getInvoiceByToken(decodeURIComponent(token));
    return NextResponse.json({ invoice });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load invoice" },
      { status: Number.isFinite(status) ? status : 500 }
    );
  }
}

export async function POST(request: Request, context: Ctx) {
  try {
    const { token } = await context.params;
    const body = (await request.json()) as {
      amount?: number;
      invoiceNumber?: string | null;
      notes?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
      pdfPath?: string | null;
      photoPaths?: string[];
    };
    const amount = Number(body.amount);
    if (!(amount > 0)) {
      return NextResponse.json({ error: "Invoice amount is required" }, { status: 400 });
    }
    const invoice = await submitVendorInvoiceByToken(decodeURIComponent(token), {
      amount,
      ...(body.invoiceNumber !== undefined ? { invoiceNumber: body.invoiceNumber } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail } : {}),
      ...(body.contactPhone !== undefined ? { contactPhone: body.contactPhone } : {}),
      ...(body.pdfPath !== undefined ? { pdfPath: body.pdfPath } : {}),
      ...(body.photoPaths !== undefined ? { photoPaths: body.photoPaths } : {})
    });
    return NextResponse.json({ invoice });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit invoice" },
      { status: Number.isFinite(status) ? status : 500 }
    );
  }
}
