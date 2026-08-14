export const TABLE_COLUMN_TYPES = ["text", "number", "date", "select", "boolean"] as const;
export type TableColumnType = (typeof TABLE_COLUMN_TYPES)[number];

export const TABLE_CONNECTION_SOURCES = [
  "facility_assets",
  "facility_stock",
  "work_orders"
] as const;
export type TableConnectionSource = (typeof TABLE_CONNECTION_SOURCES)[number];

export type TableWorkSurface = "residential" | "facility";

export type WorkspaceTableColumn = {
  id: string;
  name: string;
  dataType: TableColumnType;
  position: number;
  selectOptions: string[];
};

export type WorkspaceTableRow = {
  id: string;
  position: number;
  cells: Record<string, unknown>;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
};

export type WorkspaceTableRecord = {
  id: string;
  organizationId: string;
  title: string;
  connectionSource: TableConnectionSource | null;
  connectionSurface: TableWorkSurface | null;
  isConnected: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isTableColumnType(value: unknown): value is TableColumnType {
  return typeof value === "string" && (TABLE_COLUMN_TYPES as readonly string[]).includes(value);
}

export function isTableConnectionSource(value: unknown): value is TableConnectionSource {
  return typeof value === "string" && (TABLE_CONNECTION_SOURCES as readonly string[]).includes(value);
}

export function isTableWorkSurface(value: unknown): value is TableWorkSurface {
  return value === "residential" || value === "facility";
}

export function normalizeCellValue(dataType: TableColumnType, value: unknown): unknown {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  switch (dataType) {
    case "text":
    case "select":
      return String(value);
    case "boolean":
      if (typeof value === "boolean") return value;
      if (value === "true" || value === "1" || value === 1) return true;
      if (value === "false" || value === "0" || value === 0) return false;
      return null;
    case "number": {
      const numeric = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
      return Number.isFinite(numeric) ? numeric : null;
    }
    case "date": {
      const text = String(value);
      if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
      const parsed = Date.parse(text);
      if (Number.isNaN(parsed)) return null;
      return new Date(parsed).toISOString().slice(0, 10);
    }
    default:
      return null;
  }
}

export function displayCellValue(dataType: TableColumnType, value: unknown): string {
  const normalized = normalizeCellValue(dataType, value);
  if (normalized === null || normalized === undefined) return "";
  if (typeof normalized === "boolean") return normalized ? "Yes" : "No";
  return String(normalized);
}

export function sortTableRows(
  rows: WorkspaceTableRow[],
  columns: WorkspaceTableColumn[],
  columnId: string,
  direction: "asc" | "desc"
): WorkspaceTableRow[] {
  const column = columns.find((item) => item.id === columnId);
  if (!column) return [...rows];
  const next = [...rows];
  next.sort((left, right) => {
    const a = normalizeCellValue(column.dataType, left.cells[columnId]);
    const b = normalizeCellValue(column.dataType, right.cells[columnId]);
    if (a === null && b === null) return left.position - right.position;
    if (a === null) return 1;
    if (b === null) return -1;
    let cmp = 0;
    if (column.dataType === "number") {
      cmp = Number(a) - Number(b);
    } else if (column.dataType === "boolean") {
      cmp = Number(Boolean(a)) - Number(Boolean(b));
    } else {
      cmp = String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return next;
}

export function filterTableRows(
  rows: WorkspaceTableRow[],
  columns: WorkspaceTableColumn[],
  query: string
): WorkspaceTableRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    columns.some((column) =>
      displayCellValue(column.dataType, row.cells[column.id]).toLowerCase().includes(needle)
    )
  );
}

export function tableToMatrix(
  columns: WorkspaceTableColumn[],
  rows: WorkspaceTableRow[]
): Array<Array<string | number | boolean | Date | null>> {
  const header = columns.map((column) => column.name);
  const body = rows.map((row) =>
    columns.map((column) => {
      const value = normalizeCellValue(column.dataType, row.cells[column.id]);
      if (value === null || value === undefined) return null;
      if (column.dataType === "number" && typeof value === "number") return value;
      if (column.dataType === "boolean" && typeof value === "boolean") return value;
      if (column.dataType === "date" && typeof value === "string") {
        const parsed = Date.parse(`${value}T00:00:00Z`);
        return Number.isNaN(parsed) ? value : new Date(parsed);
      }
      return String(value);
    })
  );
  return [header, ...body];
}

export function tableToCsv(columns: WorkspaceTableColumn[], rows: WorkspaceTableRow[]): string {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const lines = [
    columns.map((column) => escape(column.name)).join(","),
    ...rows.map((row) =>
      columns
        .map((column) => escape(displayCellValue(column.dataType, row.cells[column.id])))
        .join(",")
    )
  ];
  return `${lines.join("\n")}\n`;
}

export function parseTsvMatrix(text: string): string[][] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => line.split("\t"));
}

export function applyPaste(
  columns: WorkspaceTableColumn[],
  rows: WorkspaceTableRow[],
  startRowIndex: number,
  startColumnIndex: number,
  matrix: string[][],
  connected: boolean
): WorkspaceTableRow[] {
  if (connected) {
    throw new Error("Connected tables are read-only");
  }
  const next = rows.map((row) => ({ ...row, cells: { ...row.cells } }));
  matrix.forEach((line, rowOffset) => {
    const row = next[startRowIndex + rowOffset];
    if (!row) return;
    line.forEach((cell, colOffset) => {
      const column = columns[startColumnIndex + colOffset];
      if (!column) return;
      row.cells[column.id] = normalizeCellValue(column.dataType, cell);
    });
  });
  return next;
}
