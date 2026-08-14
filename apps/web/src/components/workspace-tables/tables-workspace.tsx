"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyPaste,
  displayCellValue,
  filterTableRows,
  parseTsvMatrix,
  sortTableRows,
  TABLE_COLUMN_TYPES,
  TABLE_CONNECTION_SOURCES,
  type TableColumnType,
  type TableConnectionSource,
  type WorkspaceTableColumn,
  type WorkspaceTableRecord,
  type WorkspaceTableRow
} from "@mpa/shared";
import { Alert, Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";

type Detail = {
  table: WorkspaceTableRecord;
  columns: WorkspaceTableColumn[];
  rows: WorkspaceTableRow[];
};

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

export function TablesWorkspace() {
  const [tables, setTables] = useState<WorkspaceTableRecord[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [title, setTitle] = useState("");
  const [connectionSource, setConnectionSource] = useState<"" | TableConnectionSource>("");
  const [connectionSurface, setConnectionSurface] = useState<"residential" | "facility">("residential");
  const [columnName, setColumnName] = useState("Column");
  const [columnType, setColumnType] = useState<TableColumnType>("text");

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/shared/tables");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to load tables");
      setTables(body.tables as WorkspaceTableRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/shared/tables");
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Failed to load tables");
        if (!cancelled) setTables(body.tables as WorkspaceTableRecord[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tables");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openTable(id: string) {
    setSelectedId(id);
    const response = await fetch(`/api/shared/tables/${encodeURIComponent(id)}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Failed to open table");
      return;
    }
    setDetail(body as Detail);
    setTitle((body as Detail).table.title);
  }

  async function createTable() {
    setError(null);
    const response = await fetch("/api/shared/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "Untitled table",
        connectionSource: connectionSource || null,
        connectionSurface: connectionSource === "work_orders" ? connectionSurface : null
      })
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Failed to create table");
      return;
    }
    await loadList();
    setDetail(body as Detail);
    setSelectedId((body as Detail).table.id);
    setTitle((body as Detail).table.title);
  }

  async function rename() {
    if (!selectedId || !title.trim()) return;
    const response = await fetch(`/api/shared/tables/${encodeURIComponent(selectedId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Failed to rename");
      return;
    }
    setDetail(body as Detail);
    await loadList();
  }

  async function removeTable() {
    if (!selectedId) return;
    const response = await fetch(`/api/shared/tables/${encodeURIComponent(selectedId)}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Failed to delete");
      return;
    }
    setSelectedId(null);
    setDetail(null);
    await loadList();
  }

  async function addColumn() {
    if (!selectedId) return;
    const response = await fetch(`/api/shared/tables/${encodeURIComponent(selectedId)}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: columnName, dataType: columnType })
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Failed to add column");
      return;
    }
    await openTable(selectedId);
  }

  async function addRow() {
    if (!selectedId) return;
    const response = await fetch(`/api/shared/tables/${encodeURIComponent(selectedId)}/rows`, {
      method: "POST"
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Failed to add row");
      return;
    }
    await openTable(selectedId);
  }

  async function updateCell(rowId: string, columnId: string, value: string) {
    if (!selectedId || detail?.table.isConnected) return;
    await fetch(`/api/shared/tables/${encodeURIComponent(selectedId)}/rows/${encodeURIComponent(rowId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cells: { [columnId]: value } })
    });
  }

  async function exportTable(format: "csv" | "xlsx") {
    if (!selectedId) return;
    const response = await fetch(
      `/api/shared/tables/${encodeURIComponent(selectedId)}/export?format=${format}`
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? "Export failed");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${detail?.table.title ?? "table"}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function snapshot() {
    if (!selectedId) return;
    const response = await fetch(`/api/shared/tables/${encodeURIComponent(selectedId)}/snapshot`, {
      method: "POST"
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Snapshot failed");
      return;
    }
    setDetail(body as Detail);
  }

  const visibleRows = useMemo(() => {
    if (!detail) return [];
    const filtered = filterTableRows(detail.rows, detail.columns, query);
    if (!sortColumn) return filtered;
    return sortTableRows(filtered, detail.columns, sortColumn, sortDirection);
  }, [detail, query, sortColumn, sortDirection]);

  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    if (!detail || detail.table.isConnected) return;
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return;
    event.preventDefault();
    try {
      const next = applyPaste(detail.columns, detail.rows, 0, 0, parseTsvMatrix(text), false);
      setDetail({ ...detail, rows: next });
      next.forEach((row) => {
        void fetch(`/api/shared/tables/${encodeURIComponent(detail.table.id)}/rows/${encodeURIComponent(row.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cells: row.cells })
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paste failed");
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Shared Platform · Operational Workspace
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
          Tables
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Lightweight operational grids. Sort, filter, and export CSV or XLSX. Connected tables
          read FAC-003 and work orders — they never write those systems.
        </p>
        <Link
          href="/shared/documents"
          className={`text-sm font-medium text-[var(--mpa-color-brand-primary)] ${linkFocus}`}
        >
          Back to Documents
        </Link>
      </header>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <section className="grid gap-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-4">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Title</span>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-11" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Connection</span>
          <select
            className="block min-h-11 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3"
            value={connectionSource}
            onChange={(event) => setConnectionSource(event.target.value as "" | TableConnectionSource)}
          >
            <option value="">Native table</option>
            {TABLE_CONNECTION_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
        {connectionSource === "work_orders" ? (
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Surface</span>
            <select
              className="block min-h-11 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3"
              value={connectionSurface}
              onChange={(event) =>
                setConnectionSurface(event.target.value as "residential" | "facility")
              }
            >
              <option value="residential">Residential</option>
              <option value="facility">Facility</option>
            </select>
          </label>
        ) : (
          <div className="flex items-end">
            <Button type="button" onClick={() => void createTable()}>
              Create table
            </Button>
          </div>
        )}
        {connectionSource === "work_orders" ? (
          <div className="flex items-end">
            <Button type="button" onClick={() => void createTable()}>
              Create table
            </Button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Tables</h2>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : tables.length === 0 ? (
            <EmptyState title="No tables yet" description="Create a native grid or a read-only connection." />
          ) : (
            <ul className="space-y-2">
              {tables.map((table) => (
                <li key={table.id}>
                  <button
                    type="button"
                    onClick={() => void openTable(table.id)}
                    className={`w-full rounded-2xl border bg-white p-3 text-left ${linkFocus} ${
                      selectedId === table.id
                        ? "border-[var(--mpa-color-brand-primary)]"
                        : "border-[var(--mpa-color-border-default)]"
                    }`}
                  >
                    <span className="font-medium">{table.title}</span>
                    <div className="mt-1 flex gap-1">
                      {table.isConnected ? (
                        <Badge variant="info">{table.connectionSource}</Badge>
                      ) : (
                        <Badge variant="neutral">Native</Badge>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4">
          {!detail ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">Select or create a table.</p>
          ) : (
            <div className="space-y-3" onPaste={onPaste}>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void rename()}>
                  Rename
                </Button>
                <Button type="button" onClick={() => void exportTable("csv")}>
                  Export CSV
                </Button>
                <Button type="button" onClick={() => void exportTable("xlsx")}>
                  Export XLSX
                </Button>
                {detail.table.isConnected ? (
                  <Button type="button" onClick={() => void snapshot()}>
                    Snapshot
                  </Button>
                ) : (
                  <>
                    <Button type="button" onClick={() => void addRow()}>
                      Add row
                    </Button>
                    <Button type="button" onClick={() => void addColumn()}>
                      Add column
                    </Button>
                  </>
                )}
                <Button type="button" onClick={() => void removeTable()}>
                  Delete
                </Button>
              </div>
              {detail.table.isConnected ? (
                <Alert variant="info">
                  Read-only connection. Source records cannot be changed from this table.
                </Alert>
              ) : null}
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter rows…"
                aria-label="Filter rows"
                className="min-h-11"
              />
              {!detail.table.isConnected ? (
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={columnName}
                    onChange={(event) => setColumnName(event.target.value)}
                    aria-label="New column name"
                    className="min-h-11 max-w-[160px]"
                  />
                  <select
                    className="min-h-11 rounded-md border border-[var(--mpa-color-border-default)] px-2"
                    value={columnType}
                    onChange={(event) => setColumnType(event.target.value as TableColumnType)}
                  >
                    {TABLE_COLUMN_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      {detail.columns.map((column) => (
                        <th key={column.id} className="sticky top-0 border bg-[var(--mpa-color-bg-subtle,#f8faf8)] p-2 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              if (sortColumn === column.id) {
                                setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
                              } else {
                                setSortColumn(column.id);
                                setSortDirection("asc");
                              }
                            }}
                          >
                            {column.name}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.id}>
                        {detail.columns.map((column) => (
                          <td key={column.id} className="border p-1">
                            {detail.table.isConnected ? (
                              displayCellValue(column.dataType, row.cells[column.id])
                            ) : (
                              <input
                                className="w-full bg-transparent px-1 py-1 outline-none"
                                defaultValue={displayCellValue(column.dataType, row.cells[column.id])}
                                onBlur={(event) => void updateCell(row.id, column.id, event.target.value)}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
