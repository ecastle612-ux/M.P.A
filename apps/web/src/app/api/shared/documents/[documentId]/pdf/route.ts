import { NextResponse } from "next/server";
import { isPdfExportTemplate } from "@mpa/shared";
import { requireDocumentPermission } from "../../../../../../lib/documents/authz";
import { getDocumentDetail } from "../../../../../../lib/documents/document-service";
import { buildProfessionalPdf } from "../../../../../../lib/documents/pdf-export";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(request: Request, context: Params) {
  const authz = await requireDocumentPermission("platform.documents:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { documentId } = await context.params;
  const templateParam = new URL(request.url).searchParams.get("template");
  const template =
    templateParam && isPdfExportTemplate(templateParam) ? templateParam : undefined;

  try {
    const detail = await getDocumentDetail(authz.supabase, authz.organizationId, documentId);
    if (!detail) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const pdf = await buildProfessionalPdf({
      document: detail.document,
      contentText: detail.contentText,
      ...(template ? { template } : {})
    });

    return new NextResponse(Buffer.from(pdf.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.fileName}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export PDF" },
      { status: 400 }
    );
  }
}
