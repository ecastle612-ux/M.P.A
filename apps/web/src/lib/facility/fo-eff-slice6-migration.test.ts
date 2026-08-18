import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260818200000_docs_221_fo_eff_slice6_routing.sql"),
  "utf8"
);

describe("docs/221 FO-EFF Slice 6 migration", () => {
  it("is additive, org-scoped, and unique by explicit sort_order", () => {
    expect(migration).toContain("create table if not exists public.facility_assignment_rules");
    expect(migration).toContain("create table if not exists public.facility_assignment_rule_evaluations");
    expect(migration).toContain("unique (organization_id, sort_order)");
    expect(migration).toContain("facility_assignment_eval_initial_wo_uidx");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("Do not apply this stamp on Production");
    expect(migration).not.toContain("drop table");
    expect(migration).not.toContain("drop column");
    expect(migration).not.toContain("round robin");
    expect(migration).toContain("No executable code");
  });
});
