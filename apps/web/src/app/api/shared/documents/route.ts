import { NextResponse } from "next/server";
import {
  hasWorkspaceStaffRole,
  isDocumentCategory,
  isDocumentEntityType,
  isDocumentKind,
  isDocumentStatus
} from "@mpa/shared";
import { createAuthoredDocument } from "../../../../lib/documents/authored-service";
import { requireDocumentPermission, requireWorkspaceWrite } from "../../../../lib/documents/authz";
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

  const categoryParam = searchParams.get("category");
  if (categoryParam && !isDocumentCategory(categoryParam)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const statusParam = searchParams.get("status");
  if (statusParam && !isDocumentStatus(statusParam)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const q = searchParams.get("q");
    const propertyId = searchParams.get("propertyId");
    const kindParam = searchParams.get("kind");
    const kind =
      kindParam && kindParam !== "all" && isDocumentKind(kindParam) ? kindParam : kindParam === "all" ? "all" : undefined;
    const documents = await listDocuments(authz.supabase, authz.organizationId, {
      entityType,
      includeAuthored: hasWorkspaceStaffRole(authz.roles),
      ...(q ? { query: q } : {}),
      ...(propertyId ? { propertyId } : {}),
      ...(categoryParam && isDocumentCategory(categoryParam) ? { category: categoryParam } : {}),
      ...(statusParam && isDocumentStatus(statusParam) ? { status: statusParam } : {}),
      ...(kind ? { kind } : {})
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
  try {
    const body = (await request.json()) as {
      kind?: string;
      templateId?: string;
      entityType?: string;
      entityId?: string;
      title?: string;
      category?: string;
      fileName?: string;
      mimeType?: string;
      contentText?: string;
      contentBase64?: string;
      tags?: string[];
      notes?: string;
      keywords?: string;
      relatedLinks?: Array<{ entityType: string; entityId: string; label?: string }>;
    };

    if (body.kind === "authored") {
      const authz = await requireWorkspaceWrite();
      if ("error" in authz) {
        return authz.error;
      }
      const detail = await createAuthoredDocument(authz.supabase, authz.organizationId, authz.user.id, {
        ...(body.title ? { title: body.title } : {}),
        ...(body.templateId ? { templateId: body.templateId } : {}),
        ...(body.entityType ? { entityType: body.entityType } : {}),
        ...(body.entityId ? { entityId: body.entityId } : {}),
        ...(body.category ? { category: body.category } : {})
      });
      return NextResponse.json(detail, { status: 201 });
    }

    const authz = await requireDocumentPermission("platform.documents:write");
    if ("error" in authz) {
      return authz.error;
    }
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
      ...(body.contentBase64 ? { contentBase64: body.contentBase64 } : {}),
      ...(body.tags ? { tags: body.tags } : {}),
      ...(body.notes ? { notes: body.notes } : {}),
      ...(body.keywords ? { keywords: body.keywords } : {}),
      ...(body.relatedLinks ? { relatedLinks: body.relatedLinks } : {})
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 400 }
    );
  }
}
