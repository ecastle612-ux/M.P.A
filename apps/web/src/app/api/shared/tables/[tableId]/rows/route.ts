import { NextResponse } from "next/server";
import { requireWorkspaceWrite } from "../../../../../../lib/documents/authz";
import { addWorkspaceTableRow } from "../../../../../../lib/workspace-tables/table-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tableId: string }> };

export async function POST(_request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId } = await context.params;
  try {
    const row = await addWorkspaceTableRow(authz.supabase, authz.organizationId, authz.user.id, tableId);
    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add row";
    const status = message.includes("read-only") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
