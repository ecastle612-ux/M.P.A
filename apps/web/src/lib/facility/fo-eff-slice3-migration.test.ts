import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260818140000_docs_215_fo_eff_slice3_assets.sql"),
  "utf8"
);

describe("docs/215 FO-EFF Slice 3 migration", () => {
  it("is additive on facility_assets and reuses docs/204 intakes", () => {
    expect(migration).toContain("add column if not exists department_label");
    expect(migration).toContain("add column if not exists active_request_intake_id");
    expect(migration).toContain("references public.facility_request_intakes");
    expect(migration).toContain("facility_assets_org_serial_uidx");
    expect(migration).not.toContain("drop table");
    expect(migration).not.toContain("delete from public.facility_assets");
    expect(migration).not.toContain("maintenance_work_orders");
    expect(migration).toContain("Do not apply on Production");
  });
});
