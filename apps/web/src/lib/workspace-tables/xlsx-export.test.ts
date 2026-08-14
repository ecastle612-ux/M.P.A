import { describe, expect, it } from "vitest";
import { buildTableXlsx } from "./xlsx-export";

describe("OPS-001 XLSX export", () => {
  it("writes a valid workbook with headers, numbers, and dates", async () => {
    const result = await buildTableXlsx({
      title: "Stock snapshot",
      columns: [
        { id: "c1", name: "Name", dataType: "text", position: 0, selectOptions: [] },
        { id: "c2", name: "Qty", dataType: "number", position: 1, selectOptions: [] },
        { id: "c3", name: "Due", dataType: "date", position: 2, selectOptions: [] }
      ],
      rows: [
        {
          id: "r1",
          position: 0,
          cells: { c1: "Filter", c2: 8, c3: "2026-08-14" },
          sourceEntityType: null,
          sourceEntityId: null
        }
      ]
    });
    expect(result.fileName).toBe("Stock-snapshot.xlsx");
    expect(result.bytes[0]).toBe(0x50);
    expect(result.bytes[1]).toBe(0x4b);
    expect(result.bytes.byteLength).toBeGreaterThan(100);
  });
});
