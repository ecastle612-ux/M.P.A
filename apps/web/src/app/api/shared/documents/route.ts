import { NextResponse } from "next/server";
import { isDocumentEntityType } from "@mpa/shared";
import { requireDocumentPermission } from "../../../../lib/documents/authz";
import { listDocuments, uploadDocument } from "../../../../lib/documents/document-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authz = await requireDocumentPermission("platform.documents:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { searchParams } = new URL(request.url);
  const entityTypeParam = searchParams.get("entityType") ?? "all";
  const entityType =
    entityTypeParam === "all"
      ? "all"
      : isDocumentEntityType(entityTypeParam)
        ? entityTypeParam
        : null;
  if (!entityType) {
    return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
  }

  try {
    const q = searchParams.get("q");
    const propertyId = searchParams.get("propertyId");
    const documents = await listDocuments(authz.supabase, authz.organizationId, {
      entityType,
      ...(q ? { query: q } : {}),
      ...(propertyId ? { propertyId } : {})
    });
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list documents" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireDocumentPermission("platform.documents:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = (await request.json()) as {
      entityType?: string;
      entityId?: string;
      title?: string;
      category?: string;
      fileName?: string;
      mimeType?: string;
      contentText?: string;
      contentBase64?: string;
    };
    if (!body.entityType || !body.entityId || !body.title) {
      return NextResponse.json(
        { error: "entityType, entityId, and title are required" },
        { status: 400 }
      );
    }
    const document = await uploadDocument(authz.supabase, authz.organizationId, authz.user.id, {
      entityType: body.entityType,
      entityId: body.entityId,
      title: body.title,
      ...(body.category ? { category: body.category } : {}),
      ...(body.fileName ? { fileName: body.fileName } : {}),
      ...(body.mimeType ? { mimeType: body.mimeType } : {}),
      ...(body.contentText ? { contentText: body.contentText } : {}),
      ...(body.contentBase64 ? { contentBase64: body.contentBase64 } : {})
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 400 }
    );
  }
}
