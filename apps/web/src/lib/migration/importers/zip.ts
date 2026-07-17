import JSZip from "jszip";
import { parseCsvContent } from "./csv";
import { parseXlsxBuffer } from "./xlsx";
import type { ParsedImportFile } from "../contracts";

export type ZipExtractedFile = {
  filename: string;
  fileType: "csv" | "xlsx";
  parsed: ParsedImportFile;
};

export async function parseZipBuffer(buffer: ArrayBuffer): Promise<ZipExtractedFile[]> {
  const zip = await JSZip.loadAsync(buffer);
  const results: ZipExtractedFile[] = [];

  for (const [filename, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const lower = filename.toLowerCase();
    const content = await entry.async("arraybuffer");

    if (lower.endsWith(".csv")) {
      const text = new TextDecoder("utf-8").decode(content);
      results.push({ filename, fileType: "csv", parsed: parseCsvContent(text) });
      continue;
    }

    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      results.push({ filename, fileType: "xlsx", parsed: parseXlsxBuffer(content) });
    }
  }

  return results;
}

export function mergeParsedFiles(files: ParsedImportFile[]): ParsedImportFile {
  if (files.length === 0) return { headers: [], rows: [] };
  const headers = [...new Set(files.flatMap((file) => file.headers))];
  const rows = files.flatMap((file) => file.rows);
  return { headers, rows };
}
