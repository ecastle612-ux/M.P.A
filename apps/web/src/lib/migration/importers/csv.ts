import type { ParsedImportFile, ParsedImportRow } from "../contracts";

export function parseCsvContent(content: string): ParsedImportFile {
  const lines = splitCsvLines(content);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0] ?? "");
  const rows: ParsedImportRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line?.trim()) continue;
    const values = parseCsvLine(line);
    const row: ParsedImportRow = {};
    headers.forEach((header, columnIndex) => {
      row[header] = (values[columnIndex] ?? "").trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

function splitCsvLines(content: string): string[] {
  const normalized = content.replace(/^\uFEFF/, "");
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      lines.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0) lines.push(current);
  return lines;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}
