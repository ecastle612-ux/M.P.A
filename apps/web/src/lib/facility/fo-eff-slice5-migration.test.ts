import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260818180000_docs_219_fo_eff_slice5_pm.sql"),
  "utf8"
);

describe("docs/219 FO-EFF Slice 5 migration", () => {
  it("is additive, org-scoped, and carries a database idempotency contract", () => {
    expect(migration).toContain("create table if not exists public.facility_pm_plans");
    expect(migration).toContain("create table if not exists public.facility_pm_occurrences");
    expect(migration).toContain("unique (plan_id, occurrence_due_on)");
    expect(migration).toContain("maintenance_work_orders_pm_plan_due_uidx");
    expect(migration).toContain("add column if not exists origin_source");
    expect(migration).toContain("add column if not exists pm_plan_id");
    expect(migration).toContain("add column if not exists pm_occurrence_due_on");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("Do not apply on Production");
    expect(migration).not.toContain("drop table");
    expect(migration).not.toContain("drop column");
    expect(migration).not.toContain("delete from public.maintenance_work_orders");
    expect(migration).not.toContain("update public.maintenance_work_orders");
  });
});
