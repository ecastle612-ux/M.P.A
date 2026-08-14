import { NextResponse } from "next/server";
import { requireWorkspaceWrite } from "../../../../../../../lib/documents/authz";
import {
  deleteWorkspaceTableRow,
  updateWorkspaceTableCells
} from "../../../../../../../lib/workspace-tables/table-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tableId: string; rowId: string }> };

export async function PATCH(request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId, rowId } = await context.params;
  try {
    const body = (await request.json()) as { cells?: Record<string, unknown> };
    const row = await updateWorkspaceTableCells(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      tableId,
      rowId,
      body.cells ?? {}
    );
    return NextResponse.json({ row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update row";
    const status = message.includes("read-only") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId, rowId } = await context.params;
  try {
    await deleteWorkspaceTableRow(authz.supabase, authz.organizationId, authz.user.id, tableId, rowId);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete row";
    const status = message.includes("read-only") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
