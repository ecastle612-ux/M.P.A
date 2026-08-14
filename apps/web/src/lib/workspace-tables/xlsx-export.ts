import ExcelJS from "exceljs";
import { tableToMatrix, type WorkspaceTableColumn, type WorkspaceTableRow } from "@mpa/shared";

export async function buildTableXlsx(input: {
  title: string;
  columns: WorkspaceTableColumn[];
  rows: WorkspaceTableRow[];
}): Promise<{ bytes: Uint8Array; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "M.P.A.";
  const sheet = workbook.addWorksheet((input.title || "Table").slice(0, 31) || "Table");
  const matrix = tableToMatrix(input.columns, input.rows);
  matrix.forEach((line, index) => {
    const excelRow = sheet.addRow(line);
    if (index === 0) {
      excelRow.font = { bold: true };
    }
  });
  input.columns.forEach((column, index) => {
    const col = sheet.getColumn(index + 1);
    if (column.dataType === "number") col.numFmt = "0.##";
    if (column.dataType === "date") col.numFmt = "yyyy-mm-dd";
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  const safe = input.title.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "") || "table";
  return { bytes: new Uint8Array(buffer), fileName: `${safe}.xlsx` };
}
