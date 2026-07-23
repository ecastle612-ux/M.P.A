import { NextResponse } from "next/server";
import { uploadVendorInvoiceFile } from "../../../../../lib/vendor-payments/server";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const { token } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    const kindRaw = String(form.get("kind") ?? "photo");
    const kind = kindRaw === "pdf" ? "pdf" : "photo";
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    if (kind === "pdf" && !file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "PDF required" }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (12MB max)" }, { status: 400 });
    }
    const path = await uploadVendorInvoiceFile(
      decodeURIComponent(token),
      { bytes, contentType: file.type || (kind === "pdf" ? "application/pdf" : "image/jpeg"), fileName: file.name },
      kind
    );
    return NextResponse.json({ path });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: Number.isFinite(status) ? status : 500 }
    );
  }
}
