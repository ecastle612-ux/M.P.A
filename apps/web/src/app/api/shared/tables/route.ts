import { NextResponse } from "next/server";
import { canAccessConnection, isTableConnectionSource, isTableWorkSurface } from "@mpa/shared";
import { requireWorkspaceRead, requireWorkspaceWrite } from "../../../../lib/documents/authz";
import { createWorkspaceTable, listWorkspaceTables } from "../../../../lib/workspace-tables/table-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireWorkspaceRead();
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const tables = await listWorkspaceTables(authz.supabase, authz.organizationId);
    return NextResponse.json({ tables });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list tables" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireWorkspaceWrite();
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const body = (await request.json()) as {
      title?: string;
      connectionSource?: string | null;
      connectionSurface?: string | null;
    };
    if (body.connectionSource) {
      if (!isTableConnectionSource(body.connectionSource)) {
        return NextResponse.json({ error: "Invalid connection source" }, { status: 400 });
      }
      const surface = body.connectionSurface && isTableWorkSurface(body.connectionSurface)
        ? body.connectionSurface
        : null;
      if (!canAccessConnection(authz.entitlements, body.connectionSource, surface)) {
        return NextResponse.json(
          { error: "platform.documents is not permission to read this operational source" },
          { status: 403 }
        );
      }
    }
    const detail = await createWorkspaceTable(authz.supabase, authz.organizationId, authz.user.id, body);
    return NextResponse.json(detail, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create table" },
      { status: 400 }
    );
  }
}
