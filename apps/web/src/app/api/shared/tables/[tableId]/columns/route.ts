import { NextResponse } from "next/server";
import { requireWorkspaceWrite } from "../../../../../../lib/documents/authz";
import { addWorkspaceTableColumn } from "../../../../../../lib/workspace-tables/table-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tableId: string }> };

export async function POST(request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId } = await context.params;
  try {
    const body = (await request.json()) as {
      name?: string;
      dataType?: string;
      selectOptions?: string[];
    };
    const column = await addWorkspaceTableColumn(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      tableId,
      body
    );
    return NextResponse.json({ column }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add column";
    const status = message.includes("read-only") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
