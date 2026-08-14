import { NextResponse } from "next/server";
import { requireWorkspaceWrite } from "../../../../../../../lib/documents/authz";
import { deleteWorkspaceTableColumn } from "../../../../../../../lib/workspace-tables/table-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tableId: string; columnId: string }> };

export async function DELETE(_request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId, columnId } = await context.params;
  try {
    await deleteWorkspaceTableColumn(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      tableId,
      columnId
    );
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete column";
    const status = message.includes("read-only") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
