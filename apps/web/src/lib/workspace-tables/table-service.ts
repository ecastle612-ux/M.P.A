import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultConnectionColumns,
  isTableColumnType,
  isTableConnectionSource,
  isTableWorkSurface,
  normalizeCellValue,
  rejectWriteback,
  tableToCsv,
  type TableColumnType,
  type WorkspaceTableColumn,
  type WorkspaceTableRecord,
  type WorkspaceTableRow
} from "@mpa/shared";
import { emitPropertyEvent, writePropertyAudit } from "../property/events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type WorkspaceTableDetail = {
  table: WorkspaceTableRecord;
  columns: WorkspaceTableColumn[];
  rows: WorkspaceTableRow[];
};

function mapTable(row: Record<string, unknown>): WorkspaceTableRecord {
  const source = row["connection_source"];
  const surface = row["connection_surface"];
  return {
    id: row["id"] as string,
    organizationId: row["organization_id"] as string,
    title: row["title"] as string,
    connectionSource: isTableConnectionSource(source) ? source : null,
    connectionSurface: isTableWorkSurface(surface) ? surface : null,
    isConnected: isTableConnectionSource(source),
    deletedAt: (row["deleted_at"] as string | null) ?? null,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string
  };
}

function mapColumn(row: Record<string, unknown>): WorkspaceTableColumn {
  const options = row["select_options"];
  return {
    id: row["id"] as string,
    name: row["name"] as string,
    dataType: isTableColumnType(row["data_type"]) ? (row["data_type"] as TableColumnType) : "text",
    position: Number(row["position"] ?? 0),
    selectOptions: Array.isArray(options) ? options.filter((item): item is string => typeof item === "string") : []
  };
}

function mapRow(row: Record<string, unknown>): WorkspaceTableRow {
  const cells = row["cells"];
  return {
    id: row["id"] as string,
    position: Number(row["position"] ?? 0),
    cells: cells && typeof cells === "object" && !Array.isArray(cells) ? (cells as Record<string, unknown>) : {},
    sourceEntityType: (row["source_entity_type"] as string | null) ?? null,
    sourceEntityId: (row["source_entity_id"] as string | null) ?? null
  };
}

async function audit(
  supabase: Db,
  organizationId: string,
  actorId: string,
  action: "table.created" | "table.updated" | "table.exported",
  tableId: string,
  payload: Record<string, unknown>
) {
  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: action,
    aggregateType: "workspace_tables",
    aggregateId: tableId,
    payload
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action,
    entityType: "workspace_tables",
    entityId: tableId,
    payload
  });
}

export async function listWorkspaceTables(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("workspace_tables")
    .select("*")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapTable(row as Record<string, unknown>));
}

export async function getWorkspaceTable(
  supabase: Db,
  organizationId: string,
  tableId: string
): Promise<WorkspaceTableDetail | null> {
  const { data, error } = await supabase
    .from("workspace_tables")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", tableId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const [{ data: columns, error: columnError }, { data: rows, error: rowError }] = await Promise.all([
    supabase
      .from("workspace_table_columns")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("table_id", tableId)
      .order("position"),
    supabase
      .from("workspace_table_rows")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("table_id", tableId)
      .order("position")
  ]);
  if (columnError) throw new Error(columnError.message);
  if (rowError) throw new Error(rowError.message);

  return {
    table: mapTable(data as Record<string, unknown>),
    columns: (columns ?? []).map((row) => mapColumn(row as Record<string, unknown>)),
    rows: (rows ?? []).map((row) => mapRow(row as Record<string, unknown>))
  };
}

async function insertDefaultNativeColumns(supabase: Db, organizationId: string, tableId: string) {
  const defaults = [
    { name: "Item", dataType: "text" },
    { name: "Notes", dataType: "text" },
    { name: "Date", dataType: "date" }
  ];
  const { data, error } = await supabase
    .from("workspace_table_columns")
    .insert(
      defaults.map((column, position) => ({
        organization_id: organizationId,
        table_id: tableId,
        name: column.name,
        data_type: column.dataType,
        position,
        select_options: []
      }))
    )
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapColumn(row as Record<string, unknown>));
}

export async function createWorkspaceTable(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: {
    title?: string;
    connectionSource?: string | null;
    connectionSurface?: string | null;
  }
) {
  const title = input.title?.trim() || "Untitled table";
  const rawSource = input.connectionSource ?? null;
  if (rawSource && !isTableConnectionSource(rawSource)) {
    throw new Error("Invalid connection source");
  }
  const connectionSource = rawSource && isTableConnectionSource(rawSource) ? rawSource : null;
  const rawSurface = input.connectionSurface ?? null;
  if (rawSurface && !isTableWorkSurface(rawSurface)) {
    throw new Error("Invalid connection surface");
  }
  const connectionSurface = rawSurface && isTableWorkSurface(rawSurface) ? rawSurface : null;
  if (connectionSource === "work_orders" && !connectionSurface) {
    throw new Error("Work order connections require a surface");
  }

  const { data, error } = await supabase
    .from("workspace_tables")
    .insert({
      organization_id: organizationId,
      title,
      connection_source: connectionSource,
      connection_surface: connectionSurface,
      created_by: actorId
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create table");

  const tableId = data.id as string;
  if (connectionSource) {
    const projected = defaultConnectionColumns(connectionSource);
    const { error: columnError } = await supabase.from("workspace_table_columns").insert(
      projected.map((column, position) => ({
        organization_id: organizationId,
        table_id: tableId,
        name: column.name,
        data_type: column.dataType,
        position,
        select_options: []
      }))
    );
    if (columnError) throw new Error(columnError.message);
  } else {
    await insertDefaultNativeColumns(supabase, organizationId, tableId);
  }

  await audit(supabase, organizationId, actorId, "table.created", tableId, {
    title,
    connectionSource,
    connectionSurface
  });
  return getWorkspaceTable(supabase, organizationId, tableId);
}

export async function renameWorkspaceTable(
  supabase: Db,
  organizationId: string,
  actorId: string,
  tableId: string,
  title: string
) {
  const nextTitle = title.trim();
  if (!nextTitle) throw new Error("Title is required");
  const { error } = await supabase
    .from("workspace_tables")
    .update({ title: nextTitle, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("id", tableId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  await audit(supabase, organizationId, actorId, "table.updated", tableId, { title: nextTitle });
  return getWorkspaceTable(supabase, organizationId, tableId);
}

export async function softDeleteWorkspaceTable(
  supabase: Db,
  organizationId: string,
  actorId: string,
  tableId: string
) {
  const { data, error } = await supabase
    .from("workspace_tables")
    .update({ deleted_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("id", tableId)
    .is("deleted_at", null)
    .select("id, title")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Table not found");
  await audit(supabase, organizationId, actorId, "table.updated", tableId, {
    title: data.title,
    deleted: true
  });
  return { id: tableId, deleted: true };
}

export async function addWorkspaceTableColumn(
  supabase: Db,
  organizationId: string,
  actorId: string,
  tableId: string,
  input: { name?: string; dataType?: string; selectOptions?: string[] }
) {
  const detail = await getWorkspaceTable(supabase, organizationId, tableId);
  if (!detail) throw new Error("Table not found");
  if (detail.table.isConnected) rejectWriteback("Add column");
  const dataType = input.dataType && isTableColumnType(input.dataType) ? input.dataType : "text";
  const { data, error } = await supabase
    .from("workspace_table_columns")
    .insert({
      organization_id: organizationId,
      table_id: tableId,
      name: input.name?.trim() || "Column",
      data_type: dataType,
      position: detail.columns.length,
      select_options: input.selectOptions ?? []
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add column");
  await supabase
    .from("workspace_tables")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", tableId)
    .eq("organization_id", organizationId);
  await audit(supabase, organizationId, actorId, "table.updated", tableId, { columnAdded: data.id });
  return mapColumn(data as Record<string, unknown>);
}

export async function deleteWorkspaceTableColumn(
  supabase: Db,
  organizationId: string,
  actorId: string,
  tableId: string,
  columnId: string
) {
  const detail = await getWorkspaceTable(supabase, organizationId, tableId);
  if (!detail) throw new Error("Table not found");
  if (detail.table.isConnected) rejectWriteback("Delete column");
  const { error } = await supabase
    .from("workspace_table_columns")
    .delete()
    .eq("organization_id", organizationId)
    .eq("table_id", tableId)
    .eq("id", columnId);
  if (error) throw new Error(error.message);
  await audit(supabase, organizationId, actorId, "table.updated", tableId, { columnDeleted: columnId });
}

export async function addWorkspaceTableRow(
  supabase: Db,
  organizationId: string,
  actorId: string,
  tableId: string
) {
  const detail = await getWorkspaceTable(supabase, organizationId, tableId);
  if (!detail) throw new Error("Table not found");
  if (detail.table.isConnected) rejectWriteback("Add row");
  const { data, error } = await supabase
    .from("workspace_table_rows")
    .insert({
      organization_id: organizationId,
      table_id: tableId,
      position: detail.rows.length,
      cells: {}
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add row");
  await audit(supabase, organizationId, actorId, "table.updated", tableId, { rowAdded: data.id });
  return mapRow(data as Record<string, unknown>);
}

export async function deleteWorkspaceTableRow(
  supabase: Db,
  organizationId: string,
  actorId: string,
  tableId: string,
  rowId: string
) {
  const detail = await getWorkspaceTable(supabase, organizationId, tableId);
  if (!detail) throw new Error("Table not found");
  if (detail.table.isConnected) rejectWriteback("Delete row");
  const { error } = await supabase
    .from("workspace_table_rows")
    .delete()
    .eq("organization_id", organizationId)
    .eq("table_id", tableId)
    .eq("id", rowId);
  if (error) throw new Error(error.message);
  await audit(supabase, organizationId, actorId, "table.updated", tableId, { rowDeleted: rowId });
}

export async function updateWorkspaceTableCells(
  supabase: Db,
  organizationId: string,
  actorId: string,
  tableId: string,
  rowId: string,
  cells: Record<string, unknown>
) {
  const detail = await getWorkspaceTable(supabase, organizationId, tableId);
  if (!detail) throw new Error("Table not found");
  if (detail.table.isConnected) rejectWriteback("Cell edit");
  const row = detail.rows.find((item) => item.id === rowId);
  if (!row) throw new Error("Row not found");
  const nextCells = { ...row.cells };
  for (const [columnId, value] of Object.entries(cells)) {
    const column = detail.columns.find((item) => item.id === columnId);
    if (!column) continue;
    nextCells[columnId] = normalizeCellValue(column.dataType, value);
  }
  const { error } = await supabase
    .from("workspace_table_rows")
    .update({ cells: nextCells, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("table_id", tableId)
    .eq("id", rowId);
  if (error) throw new Error(error.message);
  await audit(supabase, organizationId, actorId, "table.updated", tableId, { rowId });
  return { ...row, cells: nextCells };
}

export async function replaceWorkspaceTableRows(
  supabase: Db,
  organizationId: string,
  tableId: string,
  rows: Array<{
    cells: Record<string, unknown>;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
  }>
) {
  const { error: deleteError } = await supabase
    .from("workspace_table_rows")
    .delete()
    .eq("organization_id", organizationId)
    .eq("table_id", tableId);
  if (deleteError) throw new Error(deleteError.message);
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from("workspace_table_rows")
    .insert(
      rows.map((row, position) => ({
        organization_id: organizationId,
        table_id: tableId,
        position,
        cells: row.cells,
        source_entity_type: row.sourceEntityType ?? null,
        source_entity_id: row.sourceEntityId ?? null
      }))
    )
    .select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export function exportTableCsv(detail: WorkspaceTableDetail) {
  return tableToCsv(detail.columns, detail.rows);
}

export async function auditTableExport(
  supabase: Db,
  organizationId: string,
  actorId: string,
  tableId: string,
  format: "csv" | "xlsx",
  connected: boolean
) {
  await audit(supabase, organizationId, actorId, "table.exported", tableId, {
    format,
    connected
  });
}
