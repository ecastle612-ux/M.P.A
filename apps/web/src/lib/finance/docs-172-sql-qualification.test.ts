import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const lifecycle = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql"),
  "utf8"
);

const maintenancePolicy = lifecycle.slice(
  lifecycle.indexOf("drop policy if exists maintenance_work_orders_insert_resident"),
  lifecycle.indexOf("revoke all on function public.utc_today()")
);

const financeHelper = lifecycle.slice(
  lifecycle.indexOf("create or replace function public.finance_resident_can_select_charge("),
  lifecycle.indexOf("-- Occupying-only. Historical money uses finance_resident_can_select_charge.")
);

const documentHelper = lifecycle.slice(
  lifecycle.indexOf("create or replace function public.tenant_can_select_document("),
  lifecycle.indexOf("-- ---------------------------------------------------------------------------\n-- D. RLS")
);

describe("docs/172 SQL qualification compatibility", () => {
  it("qualifies maintenance NEW-row columns on the target table", () => {
    expect(maintenancePolicy).toContain("maintenance_work_orders.requested_by_user_id = auth.uid()");
    expect(maintenancePolicy).toContain("residents.id = maintenance_work_orders.resident_id");
    expect(maintenancePolicy).toContain(
      "residents.organization_id = maintenance_work_orders.organization_id"
    );
    expect(maintenancePolicy).toContain(
      "leases.organization_id = maintenance_work_orders.organization_id"
    );
    expect(maintenancePolicy).toContain("maintenance_work_orders.property_id");
    expect(maintenancePolicy).toContain("maintenance_work_orders.unit_id");
    expect(maintenancePolicy).not.toMatch(/=\s+organization_id\s*$/m);
    expect(maintenancePolicy).not.toContain("is_org_member");
    expect(maintenancePolicy).not.toContain("NEW.");
    expect(maintenancePolicy).toContain("tenant_occupancy_is_current(");
  });

  it("uses record_timestamp in finance and document helpers", () => {
    expect(financeHelper).toContain("record_timestamp timestamptz");
    expect(financeHelper).toContain("tenant_finance_charge_date(period_start, due_at, record_timestamp)");
    expect(financeHelper).not.toMatch(/tenant_finance_charge_date\(period_start, due_at, created_at\)/);
    expect(documentHelper).toContain("record_timestamp timestamptz");
    expect(documentHelper).toContain("(timezone('utc', record_timestamp))::date");
    expect(documentHelper).not.toMatch(/timezone\('utc', created_at\)/);
  });

  it("keeps helper type identities and receipts issued_at", () => {
    expect(lifecycle).toContain(
      "finance_resident_can_select_charge(uuid, uuid, date, date, timestamptz)"
    );
    expect(lifecycle).toContain("tenant_can_select_document(uuid, text, uuid, timestamptz)");
    expect(lifecycle).toContain("issued_at");
    expect(lifecycle).not.toMatch(/alter table public\.financial_receipts/);
  });
});
