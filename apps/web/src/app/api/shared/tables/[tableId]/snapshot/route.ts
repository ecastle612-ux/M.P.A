import { NextResponse } from "next/server";
import { requireWorkspaceWrite } from "../../../../../../lib/documents/authz";
import { snapshotConnectedTable } from "../../../../../../lib/workspace-tables/connection-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tableId: string }> };

export async function POST(_request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId } = await context.params;
  try {
    const detail = await snapshotConnectedTable(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      authz.entitlements,
      authz.roles,
      tableId
    );
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to snapshot table";
    const status = message.includes("not permission") || message.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
