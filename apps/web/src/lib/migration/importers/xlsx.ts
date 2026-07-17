import * as XLSX from "xlsx";
import type { ParsedImportFile, ParsedImportRow } from "../contracts";

function isLikelySpreadsheet(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer);
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isOle = bytes[0] === 0xd0 && bytes[1] === 0xcf;
  return isZip || isOle;
}

export function parseXlsxBuffer(buffer: ArrayBuffer, sheetName?: string): ParsedImportFile {
  if (!isLikelySpreadsheet(buffer)) {
    return { headers: [], rows: [] };
  }

  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const targetSheet = sheetName ?? workbook.SheetNames[0];
    if (!targetSheet) {
      return { headers: [], rows: [] };
    }

    const sheet = workbook.Sheets[targetSheet];
    if (!sheet) {
      return { headers: [], rows: [] };
    }

    const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false
    });

    if (matrix.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = (matrix[0] ?? []).map((cell) => String(cell ?? "").trim()).filter(Boolean);
    const rows: ParsedImportRow[] = [];

    for (let rowIndex = 1; rowIndex < matrix.length; rowIndex += 1) {
      const line = matrix[rowIndex] ?? [];
      const hasValues = line.some((cell) => String(cell ?? "").trim().length > 0);
      if (!hasValues) continue;

      const row: ParsedImportRow = {};
      headers.forEach((header, columnIndex) => {
        row[header] = String(line[columnIndex] ?? "").trim();
      });
      rows.push(row);
    }

    return { headers, rows };
  } catch {
    return { headers: [], rows: [] };
  }
}

export function listXlsxSheetNames(buffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer, { type: "array", bookSheets: true });
  return workbook.SheetNames;
}
