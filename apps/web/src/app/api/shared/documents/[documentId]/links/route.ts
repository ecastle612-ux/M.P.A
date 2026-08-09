import { NextResponse } from "next/server";
import { requireDocumentPermission } from "../../../../../../lib/documents/authz";
import { addDocumentLink } from "../../../../../../lib/documents/document-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ documentId: string }> };

export async function POST(request: Request, context: Params) {
  const authz = await requireDocumentPermission("platform.documents:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { documentId } = await context.params;

  try {
    const body = (await request.json()) as {
      entityType?: string;
      entityId?: string;
      label?: string;
    };
    if (!body.entityType || !body.entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const link = await addDocumentLink(
      authz.supabase,
      authz.organizationId,
      documentId,
      body.entityType,
      body.entityId,
      body.label
    );
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add document link" },
      { status: 400 }
    );
  }
}
