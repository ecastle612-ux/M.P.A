import { NextResponse } from "next/server";
import { requireWorkspaceRead } from "../../../../../../lib/documents/authz";
import { hydrateConnectedTable } from "../../../../../../lib/workspace-tables/connection-service";
import { auditTableExport, exportTableCsv, getWorkspaceTable } from "../../../../../../lib/workspace-tables/table-service";
import { buildTableXlsx } from "../../../../../../lib/workspace-tables/xlsx-export";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ tableId: string }> };

export async function GET(request: Request, context: Params) {
  const authz = await requireWorkspaceRead();
  if ("error" in authz) {
    return authz.error;
  }
  const { tableId } = await context.params;
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  if (format !== "csv" && format !== "xlsx") {
    return NextResponse.json({ error: "format must be csv or xlsx" }, { status: 400 });
  }
  try {
    const stored = await getWorkspaceTable(authz.supabase, authz.organizationId, tableId);
    if (!stored) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }
    const detail = stored.table.isConnected
      ? await hydrateConnectedTable(
          authz.supabase,
          authz.organizationId,
          authz.entitlements,
          authz.roles,
          authz.user.id,
          stored
        )
      : stored;
    await auditTableExport(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      tableId,
      format,
      detail.table.isConnected
    );
    if (format === "csv") {
      const csv = exportTableCsv(detail);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${detail.table.title.replace(/[^a-zA-Z0-9._-]+/g, "-")}.csv"`
        }
      });
    }
    const xlsx = await buildTableXlsx({
      title: detail.table.title,
      columns: detail.columns,
      rows: detail.rows
    });
    return new NextResponse(Buffer.from(xlsx.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${xlsx.fileName}"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export table";
    const status = message.includes("not permission") || message.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
