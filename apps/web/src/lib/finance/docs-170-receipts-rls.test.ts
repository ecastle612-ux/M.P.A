import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const lifecycle = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql"),
  "utf8"
);

const receiptsPolicy = lifecycle.slice(
  lifecycle.indexOf("drop policy if exists financial_receipts_select_resident"),
  lifecycle.indexOf("drop policy if exists financial_charge_schedules_select_resident")
);

describe("docs/170 financial_receipts issued_at compatibility", () => {
  it("passes issued_at into the historical-access helper", () => {
    expect(receiptsPolicy).toContain("financial_receipts_select_resident");
    expect(receiptsPolicy).toContain("finance_resident_can_select_charge(");
    expect(receiptsPolicy).toContain("issued_at");
    expect(receiptsPolicy).not.toMatch(/(^|[^.\w])created_at(\s*\n\s*\))/);
  });

  it("does not assume financial_receipts.created_at exists", () => {
    expect(lifecycle).not.toMatch(/financial_receipts[\s\S]{0,400}created_at/);
    expect(lifecycle).not.toMatch(/alter table public\.financial_receipts/);
    expect(lifecycle).not.toContain("add column if not exists created_at");
  });

  it("does not rename issued_at or switch receipts to payment/charge dates", () => {
    expect(receiptsPolicy).not.toContain("payments.created_at");
    expect(receiptsPolicy).not.toContain("paid_at");
    expect(receiptsPolicy).not.toContain("due_at");
    expect(receiptsPolicy).not.toContain("period_start");
    expect(lifecycle).not.toMatch(/rename column .*issued_at/i);
  });

  it("keeps the helper parameter named created_at", () => {
    expect(lifecycle).toContain("create or replace function public.finance_resident_can_select_charge(");
    expect(lifecycle).toMatch(/finance_resident_can_select_charge\([\s\S]*?created_at timestamptz/);
  });

  it("does not mutate FIN-OPS money, July, Stripe, or SKUs", () => {
    expect(lifecycle).not.toMatch(/update public\.financial_(charges|payments|receipts|payment_allocations)/i);
    expect(lifecycle).not.toMatch(/july_freeze|stripe_payment_execution_enabled|finance_ops_cutover_state/);
    expect(lifecycle).not.toMatch(/organization_subscriptions|product_skus/);
  });

  it("leaves staff financial_receipts SELECT on member_has_finance_capability", () => {
    expect(lifecycle).not.toMatch(/drop policy if exists financial_receipts_select_staff/);
    expect(lifecycle).not.toMatch(/create policy financial_receipts_select_staff/);
    expect(lifecycle).toContain("member_has_finance_capability");
  });

  it("does not add or rename receipt timestamp columns", () => {
    expect(lifecycle).not.toMatch(/alter table public\.financial_receipts[\s\S]{0,200}add column/);
    expect(lifecycle).not.toMatch(/financial_receipts[\s\S]{0,80}rename column/);
  });
});
