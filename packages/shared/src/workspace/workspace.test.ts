import { describe, expect, it } from "vitest";
import { entitlementsForSku } from "../commercial/entitlements";
import {
  applyPaste,
  canAccessConnection,
  connectionRequiredEntitlement,
  defaultConnectionColumns,
  displayCellValue,
  documentsEntitlementIsNotEnough,
  emptyAuthoredBody,
  filterTableRows,
  flattenAuthoredBody,
  getAuthoredTemplate,
  hasWorkspaceManagerRole,
  hasWorkspaceStaffRole,
  isAuthoredBody,
  isDocumentKind,
  isTableColumnType,
  normalizeCellValue,
  parseAuthoredBody,
  parseTsvMatrix,
  rejectWriteback,
  sortTableRows,
  tableToCsv,
  tableToMatrix,
  templatesForSku,
  type WorkspaceTableColumn,
  type WorkspaceTableRow
} from "./index";

const columns: WorkspaceTableColumn[] = [
  { id: "c1", name: "Name", dataType: "text", position: 0, selectOptions: [] },
  { id: "c2", name: "Qty", dataType: "number", position: 1, selectOptions: [] },
  { id: "c3", name: "Due", dataType: "date", position: 2, selectOptions: [] }
];

const rows: WorkspaceTableRow[] = [
  { id: "r1", position: 0, cells: { c1: "Filter", c2: 10, c3: "2026-08-01" }, sourceEntityType: null, sourceEntityId: null },
  { id: "r2", position: 1, cells: { c1: "Belt", c2: 2, c3: "2026-07-01" }, sourceEntityType: null, sourceEntityId: null }
];

describe("OPS-001 authored documents", () => {
  it("distinguishes file vs authored kinds", () => {
    expect(isDocumentKind("file")).toBe(true);
    expect(isDocumentKind("authored")).toBe(true);
    expect(isDocumentKind("vault")).toBe(false);
  });

  it("flattens rich-text for PDF and search", () => {
    const body = getAuthoredTemplate("incident_report").body;
    const text = flattenAuthoredBody(body);
    expect(text).toContain("# Incident report");
    expect(text).toContain("What happened");
    expect(flattenAuthoredBody(emptyAuthoredBody())).toBe("");
  });

  it("rejects invalid authored bodies and oversized image payloads", () => {
    expect(isAuthoredBody({ type: "doc", blocks: [] })).toBe(true);
    expect(parseAuthoredBody({ type: "note", blocks: [] })).toBeNull();
    expect(
      parseAuthoredBody({
        type: "doc",
        blocks: [{ type: "image", src: "https://evil.example/x.png" }]
      })
    ).toBeNull();
  });

  it("filters templates by PM / FO / Complete surface", () => {
    const pm = templatesForSku("mpa_property_manager").map((item) => item.id);
    const fo = templatesForSku("mpa_facility_operations").map((item) => item.id);
    const complete = templatesForSku("mpa_complete_platform").map((item) => item.id);
    expect(pm).toContain("property_inspection");
    expect(pm).not.toContain("facility_inspection");
    expect(fo).toContain("asset_inspection");
    expect(fo).not.toContain("property_inspection");
    expect(complete).toContain("property_inspection");
    expect(complete).toContain("facility_inspection");
    expect(complete).toContain("blank");
  });
});

describe("OPS-001 operational tables", () => {
  it("normalizes Phase 1 value types", () => {
    expect(isTableColumnType("text")).toBe(true);
    expect(normalizeCellValue("number", "1,250")).toBe(1250);
    expect(normalizeCellValue("date", "2026-08-14T12:00:00Z")).toBe("2026-08-14");
    expect(normalizeCellValue("boolean", "true")).toBe(true);
    expect(displayCellValue("boolean", false)).toBe("No");
  });

  it("sorts and filters grids", () => {
    const byQty = sortTableRows(rows, columns, "c2", "asc");
    expect(byQty.map((row) => row.id)).toEqual(["r2", "r1"]);
    expect(filterTableRows(rows, columns, "belt")).toHaveLength(1);
  });

  it("exports CSV with headers and displayed values", () => {
    const csv = tableToCsv(columns, rows);
    expect(csv.startsWith("Name,Qty,Due\n")).toBe(true);
    expect(csv).toContain("Filter,10,2026-08-01");
  });

  it("preserves numbers and dates in the XLSX matrix", () => {
    const matrix = tableToMatrix(columns, rows);
    expect(matrix[0]).toEqual(["Name", "Qty", "Due"]);
    expect(matrix[1]?.[1]).toBe(10);
    expect(matrix[1]?.[2]).toBeInstanceOf(Date);
  });

  it("applies copy/paste on native tables and rejects connected paste", () => {
    const pasted = applyPaste(columns, rows, 0, 0, parseTsvMatrix("Gasket\t4"), false);
    expect(pasted[0]?.cells.c1).toBe("Gasket");
    expect(pasted[0]?.cells.c2).toBe(4);
    expect(() => applyPaste(columns, rows, 0, 0, [["x"]], true)).toThrow(/read-only/i);
  });
});

describe("OPS-001 read-only connections and surface isolation", () => {
  it("does not treat platform.documents as source-module permission", () => {
    const documentsOnly = ["platform.documents"];
    expect(documentsEntitlementIsNotEnough(documentsOnly, "facility_assets")).toBe(true);
    expect(canAccessConnection(documentsOnly, "facility_assets")).toBe(false);
    expect(connectionRequiredEntitlement("facility_assets")).toBe("facility.assets");
    expect(connectionRequiredEntitlement("facility_stock")).toBe("facility.inventory");
    expect(connectionRequiredEntitlement("work_orders", "residential")).toBe("pm.maintenance");
    expect(connectionRequiredEntitlement("work_orders", "facility")).toBe("facility.operations");
  });

  it("isolates PM, FO, and Complete connection sources", () => {
    const pm = entitlementsForSku("mpa_property_manager");
    const fo = entitlementsForSku("mpa_facility_operations");
    const complete = entitlementsForSku("mpa_complete_platform");

    expect(canAccessConnection(pm, "work_orders", "residential")).toBe(true);
    expect(canAccessConnection(pm, "work_orders", "facility")).toBe(false);
    expect(canAccessConnection(pm, "facility_assets")).toBe(false);
    expect(canAccessConnection(pm, "facility_stock")).toBe(false);

    expect(canAccessConnection(fo, "facility_assets")).toBe(true);
    expect(canAccessConnection(fo, "facility_stock")).toBe(true);
    expect(canAccessConnection(fo, "work_orders", "facility")).toBe(true);
    expect(canAccessConnection(fo, "work_orders", "residential")).toBe(false);

    expect(canAccessConnection(complete, "facility_assets")).toBe(true);
    expect(canAccessConnection(complete, "work_orders", "residential")).toBe(true);
    expect(canAccessConnection(complete, "work_orders", "facility")).toBe(true);
    expect(defaultConnectionColumns("facility_assets").map((col) => col.key)).toContain("asset_code");
  });

  it("rejects writeback", () => {
    expect(() => rejectWriteback("Cell edit")).toThrow(/read-only/i);
    expect(() => rejectWriteback("Quantity update")).toThrow(/inventory quantity/);
  });

  it("denies tenant/vendor/owner workspace administration", () => {
    expect(hasWorkspaceStaffRole(["tenant"])).toBe(false);
    expect(hasWorkspaceStaffRole(["vendor"])).toBe(false);
    expect(hasWorkspaceStaffRole(["property_owner"])).toBe(false);
    expect(hasWorkspaceStaffRole(["maintenance_technician"])).toBe(true);
    expect(hasWorkspaceManagerRole(["maintenance_technician"])).toBe(false);
    expect(hasWorkspaceManagerRole(["property_manager"])).toBe(true);
  });
});
