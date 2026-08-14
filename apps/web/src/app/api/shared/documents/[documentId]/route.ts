import { NextResponse } from "next/server";
import {
  restoreDocument,
  softDeleteDocument,
  updateAuthoredDocument
} from "../../../../../lib/documents/authored-service";
import { requireDocumentPermission, requireWorkspaceWrite } from "../../../../../lib/documents/authz";
import {
  ensureSignWellLeaseDocumentIndexed,
  getDocumentDetail
} from "../../../../../lib/documents/document-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(request: Request, context: Params) {
  const authz = await requireDocumentPermission("platform.documents:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { documentId } = await context.params;
  const sync = new URL(request.url).searchParams.get("syncSignWell") === "1";

  try {
    const detail =
      sync && documentId.startsWith("lease:")
        ? await ensureSignWellLeaseDocumentIndexed(
            authz.supabase,
            authz.organizationId,
            authz.user.id,
            documentId.slice("lease:".length)
          )
        : await getDocumentDetail(authz.supabase, authz.organizationId, documentId);

    if (!detail) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load document" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { documentId } = await context.params;
  try {
    const body = (await request.json()) as {
      title?: string;
      bodyJson?: unknown;
      category?: string;
      checkpoint?: boolean;
      restore?: boolean;
    };
    if (body.restore) {
      const detail = await restoreDocument(authz.supabase, authz.organizationId, authz.user.id, documentId);
      return NextResponse.json(detail);
    }
    const detail = await updateAuthoredDocument(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      documentId,
      body
    );
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update document" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { documentId } = await context.params;
  try {
    const result = await softDeleteDocument(authz.supabase, authz.organizationId, authz.user.id, documentId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete document" },
      { status: 400 }
    );
  }
}
