import { NextResponse } from "next/server";
import { requireWorkspaceRead, requireWorkspaceWrite } from "../../../../../lib/documents/authz";
import { hydrateConnectedTable } from "../../../../../lib/workspace-tables/connection-service";
import {
  getWorkspaceTable,
  renameWorkspaceTable,
  softDeleteWorkspaceTable
} from "../../../../../lib/workspace-tables/table-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tableId: string }> };

export async function GET(request: Request, context: Params) {
  const authz = await requireWorkspaceRead();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId } = await context.params;
  const mode = new URL(request.url).searchParams.get("mode");
  try {
    const detail = await getWorkspaceTable(authz.supabase, authz.organizationId, tableId);
    if (!detail) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }
    if (detail.table.isConnected && mode !== "snapshot") {
      const live = await hydrateConnectedTable(
        authz.supabase,
        authz.organizationId,
        authz.entitlements,
        authz.roles,
        authz.user.id,
        detail
      );
      return NextResponse.json(live);
    }
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load table";
    const status = message.includes("not permission") || message.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId } = await context.params;
  try {
    const body = (await request.json()) as { title?: string };
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const detail = await renameWorkspaceTable(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      tableId,
      body.title
    );
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update table" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: Params) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId } = await context.params;
  try {
    const result = await softDeleteWorkspaceTable(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      tableId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete table" },
      { status: 400 }
    );
  }
}
